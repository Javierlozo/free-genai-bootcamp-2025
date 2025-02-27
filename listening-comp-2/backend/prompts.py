import json
from typing import Dict, List

# Prompt for extracting introduction and context
INTRODUCTION_PROMPT = """Analyze this transcript and extract only the introduction section.
Focus on identifying the opening remarks, context setting, and any preliminary information.
Do not include any Q&A or conversation segments.

Format the response as a JSON object with this structure:
{
    "introduction": [
        "string containing introduction content"
    ]
}

Transcript:
{transcript}
"""

# Prompt for extracting Q&A pairs
QA_PROMPT = """Analyze this transcript and extract only the question and answer pairs.
Identify clear question-answer exchanges, including both explicit (Q: /A:) and implicit questions.

Format the response as a JSON object with this structure:
{
    "qa_pairs": [
        {
            "question": "question text",
            "answer": "answer text"
        }
    ]
}

Transcript:
{transcript}
"""

# Prompt for extracting conversation segments
CONVERSATION_PROMPT = """Analyze this transcript and extract only the conversation segments.
Focus on dialogue exchanges that are not part of Q&A pairs or introduction.
Include any discussion, explanations, or interactive segments.

Format the response as a JSON object with this structure:
{
    "conversations": [
        "string containing conversation segment"
    ]
}

Transcript:
{transcript}
"""

def format_prompt(prompt_template: str, transcript: str) -> str:
    """Format a prompt template with the transcript text"""
    return prompt_template.format(transcript=transcript)

def parse_introduction_response(response: str) -> List[str]:
    """Parse the introduction response from the LLM"""
    try:
        data = json.loads(response)
        return data.get("introduction", [])
    except json.JSONDecodeError:
        return []

def parse_qa_response(response: str) -> List[Dict[str, str]]:
    """Parse the Q&A response from the LLM"""
    try:
        data = json.loads(response)
        return data.get("qa_pairs", [])
    except json.JSONDecodeError:
        return []

def parse_conversation_response(response: str) -> List[str]:
    """Parse the conversation response from the LLM"""
    try:
        data = json.loads(response)
        return data.get("conversations", [])
    except json.JSONDecodeError:
        return [] 