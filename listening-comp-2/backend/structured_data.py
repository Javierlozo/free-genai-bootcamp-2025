from typing import List, Dict, Optional
import boto3
import json
from .prompts import (
    INTRODUCTION_PROMPT,
    QA_PROMPT,
    CONVERSATION_PROMPT,
    format_prompt,
    parse_introduction_response,
    parse_qa_response,
    parse_conversation_response
)
from .processed import (
    get_processed_dir,
    get_transcript_sections,
    list_processed_transcripts,
    delete_transcript_sections
)

class TranscriptSegment:
    def __init__(self, segment_type: str, content: str):
        self.segment_type = segment_type
        self.content = content

def extract_transcript_structure(transcript: str) -> List[TranscriptSegment]:
    """
    Extracts structured data from a transcript, identifying:
    - Introduction
    - Conversation segments
    - Questions
    - Answers
    
    Args:
        transcript (str): The full transcript text
        
    Returns:
        List[TranscriptSegment]: List of transcript segments with their types and content
    """
    segments = []
    current_segment = ""
    lines = transcript.split('\n')
    
    # First, try to identify the introduction
    introduction_end = False
    current_type = "introduction"
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for question patterns
        if line.endswith('?') or line.startswith('Q:') or line.startswith('Question:'):
            if current_segment and current_type:
                segments.append(TranscriptSegment(current_type, current_segment.strip()))
            current_type = "question"
            current_segment = line.replace('Q:', '').replace('Question:', '').strip()
            introduction_end = True
            
        # Check for answer patterns
        elif line.startswith('A:') or line.startswith('Answer:'):
            if current_segment and current_type:
                segments.append(TranscriptSegment(current_type, current_segment.strip()))
            current_type = "answer"
            current_segment = line.replace('A:', '').replace('Answer:', '').strip()
            introduction_end = True
            
        else:
            if introduction_end:
                if not current_type or current_type not in ["question", "answer"]:
                    if current_segment and current_type:
                        segments.append(TranscriptSegment(current_type, current_segment.strip()))
                    current_type = "conversation"
                    current_segment = line
                else:
                    current_segment += " " + line
            else:
                current_segment += " " + line
    
    # Add the last segment
    if current_segment and current_type:
        segments.append(TranscriptSegment(current_type, current_segment.strip()))
    
    return segments

def format_structured_data(segments: List[TranscriptSegment]) -> Dict[str, List[str]]:
    """
    Formats the extracted segments into a dictionary with categorized content.
    
    Args:
        segments (List[TranscriptSegment]): List of transcript segments
        
    Returns:
        Dict[str, List[str]]: Dictionary with categorized content
    """
    structured_data = {
        "introduction": [],
        "conversation": [],
        "questions": [],
        "answers": []
    }
    
    for segment in segments:
        if segment.segment_type == "introduction":
            structured_data["introduction"].append(segment.content)
        elif segment.segment_type == "conversation":
            structured_data["conversation"].append(segment.content)
        elif segment.segment_type == "question":
            structured_data["questions"].append(segment.content)
        elif segment.segment_type == "answer":
            structured_data["answers"].append(segment.content)
    
    return structured_data

def process_transcript(transcript: str) -> Dict[str, List[str]]:
    """
    Main function to process a transcript and return structured data.
    
    Args:
        transcript (str): The full transcript text
        
    Returns:
        Dict[str, List[str]]: Structured data containing introduction, conversation, questions, and answers
    """
    segments = extract_transcript_structure(transcript)
    return format_structured_data(segments)

def get_bedrock_client():
    """
    Initialize and return the Amazon Bedrock client
    """
    return boto3.client(
        service_name='bedrock-runtime',
        region_name='us-east-1'
    )

def process_with_llm(bedrock_client, prompt: str) -> str:
    """
    Process a prompt using Amazon Bedrock's Nova Micro model
    
    Args:
        bedrock_client: The Bedrock client
        prompt (str): The formatted prompt to process
        
    Returns:
        str: The LLM response
    """
    messages = [{
        "role": "user",
        "content": [{
            "text": prompt
        }]
    }]
    
    try:
        response = bedrock_client.converse(
            modelId='amazon.nova-micro-v1',
            messages=messages,
            inferenceConfig={
                "temperature": 0.0
            }
        )
        
        return response['output']['message']['content'][0]['text']
        
    except Exception as e:
        print(f"Error processing with Bedrock: {str(e)}")
        return ""

def save_section_to_file(data: Dict, section_name: str, transcript_id: str) -> None:
    """
    Save a section's data to a JSON file
    
    Args:
        data (Dict): The data to save
        section_name (str): The name of the section (introduction, qa, conversation)
        transcript_id (str): Identifier for the transcript
    """
    processed_dir = get_processed_dir()
    filename = processed_dir / f"{transcript_id}_{section_name}.json"
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved {section_name} data to {filename}")
    except Exception as e:
        print(f"Error saving {section_name} data: {str(e)}")

def process_transcript_sections(transcript: str, transcript_id: str, force_reprocess: bool = False) -> Dict[str, List[str]]:
    """
    Process transcript using separate LLM calls for each section
    
    Args:
        transcript (str): The full transcript text
        transcript_id (str): Identifier for the transcript
        force_reprocess (bool): If True, reprocess even if sections exist
        
    Returns:
        Dict[str, List[str]]: Combined structured data from all sections
    """
    # Check if we already have processed sections
    if not force_reprocess:
        existing_sections = get_transcript_sections(transcript_id)
        if existing_sections:
            print(f"Found existing processed sections for transcript {transcript_id}")
            # Convert to the expected format
            return {
                "introduction": existing_sections.get("introduction", {}).get("introduction", []),
                "questions": [qa["question"] for qa in existing_sections.get("qa", {}).get("qa_pairs", [])],
                "answers": [qa["answer"] for qa in existing_sections.get("qa", {}).get("qa_pairs", [])],
                "conversation": existing_sections.get("conversation", {}).get("conversations", [])
            }
    
    # If we need to process, delete any existing sections first
    if force_reprocess:
        delete_transcript_sections(transcript_id)
    
    bedrock = get_bedrock_client()
    
    # Process introduction
    intro_prompt = format_prompt(INTRODUCTION_PROMPT, transcript)
    intro_response = process_with_llm(bedrock, intro_prompt)
    introduction = parse_introduction_response(intro_response)
    save_section_to_file({"introduction": introduction}, "introduction", transcript_id)
    
    # Process Q&A pairs
    qa_prompt = format_prompt(QA_PROMPT, transcript)
    qa_response = process_with_llm(bedrock, qa_prompt)
    qa_pairs = parse_qa_response(qa_response)
    save_section_to_file({"qa_pairs": qa_pairs}, "qa", transcript_id)
    
    # Process conversation segments
    conv_prompt = format_prompt(CONVERSATION_PROMPT, transcript)
    conv_response = process_with_llm(bedrock, conv_prompt)
    conversations = parse_conversation_response(conv_response)
    save_section_to_file({"conversations": conversations}, "conversation", transcript_id)
    
    # Combine all sections for the return value
    return {
        "introduction": introduction,
        "questions": [pair["question"] for pair in qa_pairs],
        "answers": [pair["answer"] for pair in qa_pairs],
        "conversation": conversations
    }

def print_transcript_segments(structured_data: Dict[str, List[str]]) -> None:
    """
    Print the transcript segments in a readable format to the console.
    
    Args:
        structured_data (Dict[str, List[str]]): Dictionary containing the structured transcript data
    """
    print("\n" + "="*50)
    print("TRANSCRIPT ANALYSIS")
    print("="*50 + "\n")
    
    # Print Introduction
    if structured_data["introduction"]:
        print("📝 INTRODUCTION:")
        print("-"*20)
        for intro in structured_data["introduction"]:
            print(intro)
        print()
    
    # Print Questions and Answers together
    if structured_data["questions"] or structured_data["answers"]:
        print("❓ Q&A SEGMENTS:")
        print("-"*20)
        for q, a in zip(structured_data["questions"], structured_data["answers"]):
            print(f"Q: {q}")
            print(f"A: {a}\n")
    
    # Print Conversation segments
    if structured_data["conversation"]:
        print("💬 CONVERSATION SEGMENTS:")
        print("-"*20)
        for conv in structured_data["conversation"]:
            print(conv)
            print()
    
    print("="*50 + "\n")
