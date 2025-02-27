import chromadb
import os
from pathlib import Path

# setup Chroma in-memory, for easy prototyping. Can add persistence easily!
client = chromadb.Client()

# Create collection. get_collection, get_or_create_collection, delete_collection also available!
collection = client.create_collection("listening-comprehension")

def add_documents_from_directory(directory_path):
    # Get all .txt files from the directory
    txt_files = Path(directory_path).glob('*.txt')
    
    documents = []
    metadatas = []
    ids = []
    
    for file_path in txt_files:
        # Read the content of each file
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Add the document details to our lists
        documents.append(content)
        metadatas.append({
            "source": file_path.name,
            "path": str(file_path)
        })
        ids.append(f"doc_{file_path.stem}")  # Using filename without extension as ID

    # Add all documents to the collection if we found any
    if documents:
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )
        print(f"Added {len(documents)} documents to the collection")
    else:
        print("No text files found in the directory")

# Example usage:
transcripts_dir = "backend/transcripts"
add_documents_from_directory(transcripts_dir)

# Query/search 2 most similar results. You can also .get by id
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    # where={"metadata_field": "is_equal_to_this"}, # optional filter
    # where_document={"$contains":"search_string"}  # optional filter
)