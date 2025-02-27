"""Functions for managing processed transcript sections."""

import os
import json
from typing import Dict, List, Optional
from pathlib import Path

def get_processed_dir() -> Path:
    """Get the path to the processed directory and create it if it doesn't exist."""
    processed_dir = Path(__file__).parent
    processed_dir.mkdir(exist_ok=True)
    return processed_dir

def get_transcript_sections(transcript_id: str) -> Dict[str, any]:
    """
    Get all processed sections for a transcript.
    
    Args:
        transcript_id (str): The transcript identifier
        
    Returns:
        Dict containing all sections if found, empty dict otherwise
    """
    processed_dir = get_processed_dir()
    sections = {}
    
    # Try to load each section
    section_types = ['introduction', 'qa', 'conversation']
    for section in section_types:
        file_path = processed_dir / f"{transcript_id}_{section}.json"
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    sections[section] = json.load(f)
            except json.JSONDecodeError:
                print(f"Error reading {section} section for transcript {transcript_id}")
    
    return sections

def list_processed_transcripts() -> List[str]:
    """
    List all transcript IDs that have processed sections.
    
    Returns:
        List[str]: List of unique transcript IDs
    """
    processed_dir = get_processed_dir()
    files = list(processed_dir.glob("*.json"))
    
    # Extract unique transcript IDs from filenames
    transcript_ids = set()
    for file in files:
        # Split filename and remove section identifier
        parts = file.stem.rsplit('_', 1)
        if len(parts) == 2:
            transcript_ids.add(parts[0])
    
    return sorted(list(transcript_ids))

def delete_transcript_sections(transcript_id: str) -> bool:
    """
    Delete all processed sections for a transcript.
    
    Args:
        transcript_id (str): The transcript identifier
        
    Returns:
        bool: True if any sections were deleted, False otherwise
    """
    processed_dir = get_processed_dir()
    deleted = False
    
    for file in processed_dir.glob(f"{transcript_id}_*.json"):
        try:
            file.unlink()
            deleted = True
        except Exception as e:
            print(f"Error deleting {file}: {str(e)}")
    
    return deleted 