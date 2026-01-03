"""
Test script to verify Qdrant and Cohere connections.
"""
import os
from dotenv import load_dotenv
import cohere
from qdrant_client import QdrantClient

# Load environment variables
load_dotenv()

print("=" * 60)
print("Testing API Connections")
print("=" * 60)

# Test Qdrant Connection
print("\n1. Testing Qdrant Connection...")
try:
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
    )

    collections = qdrant_client.get_collections()
    print(f"[OK] Qdrant connection successful!")
    print(f"   URL: {os.getenv('QDRANT_URL')}")
    print(f"   Existing collections: {[c.name for c in collections.collections]}")
except Exception as e:
    print(f"[FAIL] Qdrant connection failed: {e}")

# Test Cohere Connection
print("\n2. Testing Cohere Connection...")
try:
    cohere_client = cohere.Client(os.getenv("COHERE_API_KEY"))

    # Test with a simple embedding
    response = cohere_client.embed(
        texts=["Hello, world!"],
        model='embed-english-v3.0',
        input_type='search_document'
    )

    print(f"[OK] Cohere connection successful!")
    print(f"   API Key: {os.getenv('COHERE_API_KEY')[:10]}...")
    print(f"   Embedding dimension: {len(response.embeddings[0])}")
except Exception as e:
    print(f"[FAIL] Cohere connection failed: {e}")

print("\n" + "=" * 60)
print("Connection tests complete!")
print("=" * 60)
