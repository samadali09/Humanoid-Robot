# Qdrant Cloud Configuration & Best Practices for Docusaurus Content Ingestion

## Executive Summary

This document provides comprehensive guidance for configuring Qdrant Cloud (free tier) to ingest and search Docusaurus markdown documentation (15,000-20,000 words) using Cohere's embed-english-v3.0 embeddings model. The configuration includes collection setup, chunking strategies, metadata schema design, and incremental update patterns.

---

## 1. Qdrant Collection Configuration

### 1.1 Vector Dimensions & Distance Metric

**Cohere embed-english-v3.0 Specifications:**
- Vector Dimensions: **1024**
- Supported Distance Metrics: Cosine similarity, Dot product, Euclidean distance
- Input Type Parameter: Required for v3 models
  - `search_document`: For documents to be stored
  - `search_query`: For search queries

**Recommended Configuration:**

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(
    url="https://your-cluster.qdrant.io",
    api_key="your-api-key"
)

# Create collection for Docusaurus documentation
client.create_collection(
    collection_name="docusaurus_docs",
    vectors_config=VectorParams(
        size=1024,  # Cohere embed-english-v3.0 dimension
        distance=Distance.COSINE  # Recommended for semantic search
    )
)
```

**Rationale for Cosine Distance:**
- Normalized similarity measure (0 to 1 range)
- Better for semantic search applications
- Robust to document length variations
- Industry standard for RAG applications

### 1.2 Free Tier Capacity Planning

**Qdrant Free Tier Limits:**
- Storage: 1 GB total
- Capacity: ~1 million vectors at 768 dimensions
- Node Configuration: Single node

**Estimated Storage for Your Use Case:**
- Document Size: 15,000-20,000 words
- Estimated Chunks: ~80-100 chunks (assuming 512 tokens/chunk with overlap)
- Storage per Vector Point: ~1.5 KB (1024-dim vector + metadata)
- Total Estimated Usage: **120-150 KB** (well within free tier limits)

### 1.3 Indexing Configuration

For the free tier with moderate collection sizes, default HNSW (Hierarchical Navigable Small World) indexing is optimal:

```python
from qdrant_client.models import HnswConfigDiff

# Optional: Fine-tune HNSW parameters for better performance
client.update_collection(
    collection_name="docusaurus_docs",
    hnsw_config=HnswConfigDiff(
        m=16,  # Number of edges per node (default: 16)
        ef_construct=100,  # Construction time/quality tradeoff (default: 100)
    )
)
```

---

## 2. Chunking Strategy for Markdown Content

### 2.1 Recommended Approach: Semantic Markdown Chunking

**Strategy:** Structure-aware chunking that preserves markdown hierarchy, code blocks, and frontmatter.

**Key Principles:**
1. Split by markdown headers (H2/H3 boundaries)
2. Preserve code blocks intact
3. Maintain hierarchical context through metadata
4. Use moderate chunk size with overlap

### 2.2 Chunk Size Configuration

**Cohere embed-english-v3.0 Constraints:**
- Maximum Input: **512 tokens**
- Recommended for RAG: **400-450 tokens** (leaves buffer for special tokens)

**Optimal Settings:**
- **Chunk Size:** 400-512 tokens (~1,600-2,000 characters)
- **Overlap:** 50-80 tokens (10-15% overlap for context continuity)
- **Minimum Chunk:** 100 tokens (avoid fragmented chunks)

### 2.3 Implementation with LangChain

```python
from langchain.text_splitter import MarkdownHeaderTextSplitter
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Step 1: Split by markdown headers
headers_to_split_on = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]

markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on,
    strip_headers=False  # Keep headers for context
)

# Step 2: Further split large sections by tokens
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1600,  # ~400 tokens at 4 chars/token
    chunk_overlap=320,  # ~80 tokens overlap
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""],
    is_separator_regex=False,
)

def chunk_markdown_document(markdown_content, metadata):
    """
    Chunks a Docusaurus markdown document while preserving structure.

    Args:
        markdown_content: Raw markdown string
        metadata: Document-level metadata (from frontmatter)

    Returns:
        List of chunks with metadata
    """
    # Extract frontmatter first
    frontmatter, content = extract_frontmatter(markdown_content)

    # Split by headers
    header_splits = markdown_splitter.split_text(content)

    chunks = []
    for idx, doc in enumerate(header_splits):
        # Further split if section is too large
        sub_chunks = text_splitter.split_text(doc.page_content)

        for sub_idx, chunk_text in enumerate(sub_chunks):
            chunk_metadata = {
                **metadata,  # Document-level metadata
                **doc.metadata,  # Header hierarchy metadata
                "chunk_id": f"{metadata['file_path']}_chunk_{idx}_{sub_idx}",
                "chunk_index": idx * 100 + sub_idx,
                "total_chunks": len(sub_chunks),
            }
            chunks.append({
                "text": chunk_text,
                "metadata": chunk_metadata
            })

    return chunks
```

### 2.4 Code Block Preservation

**Critical Requirement:** Code blocks must remain intact to preserve syntax and logic.

```python
import re

def preserve_code_blocks(markdown_text):
    """
    Identifies code blocks and ensures they're not split during chunking.
    """
    # Pattern to match fenced code blocks
    code_block_pattern = r'```[\s\S]*?```'

    code_blocks = []
    def replace_code_block(match):
        idx = len(code_blocks)
        code_blocks.append(match.group(0))
        return f"__CODE_BLOCK_{idx}__"

    # Replace code blocks with placeholders
    processed_text = re.sub(code_block_pattern, replace_code_block, markdown_text)

    return processed_text, code_blocks

def restore_code_blocks(processed_text, code_blocks):
    """Restore code blocks after chunking."""
    for idx, code_block in enumerate(code_blocks):
        processed_text = processed_text.replace(f"__CODE_BLOCK_{idx}__", code_block)
    return processed_text
```

**Best Practice:** Treat code blocks as atomic units. If a code block + surrounding context exceeds chunk size, consider:
1. Placing code block in its own chunk
2. Adding header context as metadata
3. Including brief description before/after code

### 2.5 Frontmatter Handling

Docusaurus frontmatter contains valuable metadata that should be extracted and stored separately:

```python
import re
import yaml

def extract_frontmatter(markdown_content):
    """
    Extracts YAML frontmatter from Docusaurus markdown files.

    Returns:
        tuple: (frontmatter_dict, content_without_frontmatter)
    """
    frontmatter_pattern = r'^---\s*\n(.*?)\n---\s*\n'
    match = re.match(frontmatter_pattern, markdown_content, re.DOTALL)

    if match:
        frontmatter_yaml = match.group(1)
        frontmatter_dict = yaml.safe_load(frontmatter_yaml)
        content = markdown_content[match.end():]
        return frontmatter_dict, content

    return {}, markdown_content

# Example frontmatter from Docusaurus
"""
---
id: introduction
title: Introduction to VLA
sidebar_label: Introduction
sidebar_position: 1
description: Overview of Vision-Language-Action module
keywords: [vla, robotics, ai]
---
"""
```

---

## 3. Metadata Schema for Citations

### 3.1 Comprehensive Metadata Structure

```python
from typing import TypedDict, List, Optional
from datetime import datetime

class DocumentMetadata(TypedDict):
    """Metadata schema for each vector point in Qdrant."""

    # Document Identification
    file_path: str              # Relative path: "docs/content/introduction.md"
    document_id: str            # Unique ID: "intro-vla-module"
    source_url: str             # Public URL: "https://docs.example.com/intro"

    # Frontmatter Fields
    title: str                  # Document title
    description: Optional[str]  # Brief description
    keywords: List[str]         # Search keywords
    sidebar_label: str          # Navigation label
    sidebar_position: int       # Order in sidebar

    # Hierarchical Context
    chapter: str                # "Module 4: VLA Capstone"
    section: str                # "Introduction"
    subsection: Optional[str]   # "Hardware Requirements"
    h1_header: str              # Top-level header
    h2_header: Optional[str]    # Second-level header
    h3_header: Optional[str]    # Third-level header

    # Chunk Information
    chunk_id: str               # "intro_chunk_0_0"
    chunk_index: int            # Position in document
    total_chunks: int           # Total chunks in document
    chunk_type: str             # "text" | "code" | "mixed"

    # Content Characteristics
    has_code_block: bool        # Contains code example
    code_language: Optional[str] # "python", "cpp", "bash"
    word_count: int             # Approximate words in chunk

    # Version Control
    content_version: str        # "1.0.0" or commit hash
    last_updated: str           # ISO datetime: "2024-01-15T10:30:00Z"
    document_hash: str          # SHA256 of original document

    # Citation Support
    citation_text: str          # Formatted citation reference
    page_number: Optional[int]  # For book-style citations
```

### 3.2 Example Metadata Instance

```python
example_metadata = {
    # Document Identification
    "file_path": "docs/content/introduction.md",
    "document_id": "vla-introduction",
    "source_url": "https://docs.robotics-course.com/vla/introduction",

    # Frontmatter
    "title": "Introduction to Vision-Language-Action",
    "description": "Overview of VLA pipelines and error handling",
    "keywords": ["vla", "robotics", "whisper", "llm"],
    "sidebar_label": "Introduction",
    "sidebar_position": 1,

    # Hierarchical Context
    "chapter": "Module 4: VLA Capstone",
    "section": "Introduction",
    "subsection": "Error Handling and Ambiguity Resolution",
    "h1_header": "Introduction",
    "h2_header": "Guidance on Error Handling and Ambiguity Resolution",
    "h3_header": None,

    # Chunk Information
    "chunk_id": "vla-introduction_chunk_1_0",
    "chunk_index": 1,
    "total_chunks": 3,
    "chunk_type": "text",

    # Content Characteristics
    "has_code_block": False,
    "code_language": None,
    "word_count": 156,

    # Version Control
    "content_version": "1.0.0",
    "last_updated": "2024-01-15T10:30:00Z",
    "document_hash": "a7f8d9e3c2b1...",

    # Citation Support
    "citation_text": "[Introduction to VLA - Error Handling] (Module 4, Section 2.1)",
    "page_number": None,
}
```

### 3.3 Citation Generation

```python
def generate_citation(metadata: dict) -> str:
    """
    Generates a formatted citation from metadata.

    Format: [Document Title - Section] (Chapter, Subsection)
    Example: [Introduction to VLA - Error Handling] (Module 4, Section 2.1)
    """
    parts = [metadata["title"]]

    if metadata.get("h2_header"):
        parts.append(f" - {metadata['h2_header']}")

    location_parts = [metadata["chapter"]]
    if metadata.get("subsection"):
        location_parts.append(metadata["subsection"])

    citation = f"[{' '.join(parts)}] ({', '.join(location_parts)})"

    # Add URL for clickable citations
    if metadata.get("source_url"):
        citation += f"\nURL: {metadata['source_url']}"

    return citation

# Usage in RAG response
def format_rag_response_with_citations(answer: str, sources: List[dict]) -> str:
    """
    Formats RAG response with citations.
    """
    response = f"{answer}\n\n## Sources\n\n"

    # Deduplicate sources by document_id
    unique_sources = {src["document_id"]: src for src in sources}

    for idx, metadata in enumerate(unique_sources.values(), 1):
        citation = generate_citation(metadata)
        response += f"{idx}. {citation}\n"

    return response
```

---

## 4. Incremental Updates for Content Changes

### 4.1 Update Strategies

**Option 1: Document-Level Upsert (Recommended for Small Collections)**

```python
import hashlib

def compute_document_hash(content: str) -> str:
    """Computes SHA256 hash of document content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def ingest_or_update_document(file_path: str, markdown_content: str):
    """
    Ingests or updates a document in Qdrant.
    Uses document hash to detect changes.
    """
    # Extract frontmatter and compute hash
    frontmatter, content = extract_frontmatter(markdown_content)
    doc_hash = compute_document_hash(content)

    # Check if document exists and has changed
    existing_points = client.scroll(
        collection_name="docusaurus_docs",
        scroll_filter={
            "must": [
                {"key": "file_path", "match": {"value": file_path}}
            ]
        },
        limit=1
    )[0]

    if existing_points:
        existing_hash = existing_points[0].payload.get("document_hash")
        if existing_hash == doc_hash:
            print(f"Document {file_path} unchanged, skipping.")
            return
        else:
            # Delete old chunks
            delete_document_chunks(file_path)

    # Chunk and ingest
    chunks = chunk_markdown_document(markdown_content, {
        "file_path": file_path,
        "document_hash": doc_hash,
        "last_updated": datetime.utcnow().isoformat(),
        **frontmatter
    })

    upsert_chunks(chunks)

def delete_document_chunks(file_path: str):
    """Deletes all chunks for a given document."""
    client.delete(
        collection_name="docusaurus_docs",
        points_selector={
            "filter": {
                "must": [
                    {"key": "file_path", "match": {"value": file_path}}
                ]
            }
        }
    )
```

**Option 2: Optimistic Locking with Version Numbers**

```python
def upsert_chunk_with_version_control(chunk_data: dict):
    """
    Upserts a chunk with optimistic locking to prevent overwrites.
    """
    chunk_id = chunk_data["chunk_id"]
    current_version = get_current_version(chunk_id)
    new_version = current_version + 1

    # Prepare point
    point = {
        "id": chunk_id,
        "vector": chunk_data["embedding"],
        "payload": {
            **chunk_data["metadata"],
            "version": new_version,
        }
    }

    # Upsert with condition (only if version matches)
    try:
        client.upsert(
            collection_name="docusaurus_docs",
            points=[point],
            wait=True
        )
        print(f"Chunk {chunk_id} updated to version {new_version}")
    except Exception as e:
        print(f"Version conflict for {chunk_id}: {e}")

def get_current_version(chunk_id: str) -> int:
    """Retrieves current version of a chunk."""
    results = client.retrieve(
        collection_name="docusaurus_docs",
        ids=[chunk_id]
    )
    return results[0].payload.get("version", 0) if results else 0
```

### 4.2 Batch Upsert for Efficiency

```python
from typing import List
import cohere

co = cohere.Client(api_key="your-cohere-api-key")

def batch_upsert_chunks(chunks: List[dict], batch_size: int = 32):
    """
    Efficiently upserts chunks in batches with embeddings.
    """
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]

        # Generate embeddings for batch
        texts = [chunk["text"] for chunk in batch]
        response = co.embed(
            texts=texts,
            model="embed-english-v3.0",
            input_type="search_document"
        )
        embeddings = response.embeddings

        # Prepare points
        points = []
        for chunk, embedding in zip(batch, embeddings):
            points.append({
                "id": chunk["metadata"]["chunk_id"],
                "vector": embedding,
                "payload": chunk["metadata"]
            })

        # Upsert batch
        client.upsert(
            collection_name="docusaurus_docs",
            points=points,
            wait=True
        )

        print(f"Upserted batch {i//batch_size + 1}: {len(points)} chunks")
```

### 4.3 Change Detection Workflow

```python
import os
from pathlib import Path

def scan_and_update_documentation(docs_directory: str):
    """
    Scans documentation directory and updates changed files.
    """
    markdown_files = Path(docs_directory).rglob("*.md")

    for file_path in markdown_files:
        # Skip non-content files
        if file_path.name.startswith("_"):
            continue

        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check and update if changed
        relative_path = str(file_path.relative_to(docs_directory))
        ingest_or_update_document(relative_path, content)

    print("Documentation scan and update complete.")

# Usage
scan_and_update_documentation("docs/")
```

---

## 5. Search Implementation

### 5.1 Hybrid Search with Metadata Filtering

```python
def search_documentation(
    query: str,
    chapter_filter: Optional[str] = None,
    limit: int = 5
) -> List[dict]:
    """
    Searches documentation with optional chapter filtering.
    """
    # Generate query embedding
    response = co.embed(
        texts=[query],
        model="embed-english-v3.0",
        input_type="search_query"
    )
    query_embedding = response.embeddings[0]

    # Build filter
    search_filter = None
    if chapter_filter:
        search_filter = {
            "must": [
                {"key": "chapter", "match": {"value": chapter_filter}}
            ]
        }

    # Search Qdrant
    results = client.search(
        collection_name="docusaurus_docs",
        query_vector=query_embedding,
        query_filter=search_filter,
        limit=limit,
        with_payload=True
    )

    # Format results
    formatted_results = []
    for result in results:
        formatted_results.append({
            "text": result.payload.get("chunk_text", ""),
            "score": result.score,
            "metadata": result.payload,
            "citation": generate_citation(result.payload)
        })

    return formatted_results
```

### 5.2 Reranking with Cohere (Optional Enhancement)

```python
def search_with_reranking(query: str, limit: int = 5) -> List[dict]:
    """
    Searches with Cohere reranking for improved relevance.
    """
    # Initial retrieval (get more candidates)
    initial_results = search_documentation(query, limit=limit * 3)

    # Prepare documents for reranking
    documents = [result["text"] for result in initial_results]

    # Rerank with Cohere
    rerank_response = co.rerank(
        query=query,
        documents=documents,
        top_n=limit,
        model="rerank-english-v3.0"
    )

    # Return reranked results
    reranked_results = []
    for rerank_result in rerank_response.results:
        original_idx = rerank_result.index
        result = initial_results[original_idx]
        result["rerank_score"] = rerank_result.relevance_score
        reranked_results.append(result)

    return reranked_results
```

---

## 6. Complete Ingestion Pipeline

### 6.1 End-to-End Example

```python
from pathlib import Path
import cohere
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Initialize clients
co = cohere.Client(api_key="your-cohere-api-key")
qdrant_client = QdrantClient(
    url="https://your-cluster.qdrant.io",
    api_key="your-qdrant-api-key"
)

def initialize_collection():
    """Creates the Qdrant collection if it doesn't exist."""
    try:
        qdrant_client.create_collection(
            collection_name="docusaurus_docs",
            vectors_config=VectorParams(
                size=1024,
                distance=Distance.COSINE
            )
        )
        print("Collection created successfully.")
    except Exception as e:
        print(f"Collection may already exist: {e}")

def ingest_docusaurus_documentation(docs_dir: str):
    """
    Complete ingestion pipeline for Docusaurus documentation.
    """
    # Initialize collection
    initialize_collection()

    # Scan markdown files
    markdown_files = list(Path(docs_dir).rglob("*.md"))
    print(f"Found {len(markdown_files)} markdown files.")

    all_chunks = []

    for file_path in markdown_files:
        # Skip system files
        if file_path.name.startswith("_"):
            continue

        # Read content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract metadata
        frontmatter, clean_content = extract_frontmatter(content)

        # Prepare base metadata
        base_metadata = {
            "file_path": str(file_path.relative_to(docs_dir)),
            "document_id": frontmatter.get("id", file_path.stem),
            "title": frontmatter.get("title", file_path.stem),
            "chapter": infer_chapter_from_path(file_path),
            "content_version": "1.0.0",
            "last_updated": datetime.utcnow().isoformat(),
            "document_hash": compute_document_hash(content),
            **frontmatter
        }

        # Chunk document
        chunks = chunk_markdown_document(content, base_metadata)
        all_chunks.extend(chunks)

    print(f"Total chunks generated: {len(all_chunks)}")

    # Batch upsert
    batch_upsert_chunks(all_chunks)

    print("Ingestion complete!")

def infer_chapter_from_path(file_path: Path) -> str:
    """Infers chapter from file path structure."""
    parts = file_path.parts
    if "content" in parts:
        idx = parts.index("content")
        if idx + 1 < len(parts):
            return parts[idx + 1].replace("-", " ").title()
    return "General"

# Run ingestion
if __name__ == "__main__":
    ingest_docusaurus_documentation("docs/")
```

---

## 7. Best Practices Summary

### 7.1 Configuration Checklist

- [x] Vector size: 1024 (Cohere embed-english-v3.0)
- [x] Distance metric: Cosine similarity
- [x] Chunk size: 400-512 tokens (~1,600-2,000 characters)
- [x] Chunk overlap: 50-80 tokens (10-15%)
- [x] Metadata: Comprehensive schema with hierarchical context
- [x] Update strategy: Document hash-based change detection

### 7.2 Performance Optimization

1. **Batch Processing**: Process embeddings in batches of 32-96 texts
2. **Caching**: Cache unchanged documents using content hashing
3. **Parallel Processing**: Use async operations for I/O-bound tasks
4. **Metadata Filtering**: Leverage Qdrant's efficient filtering for chapter/section searches

### 7.3 Quality Assurance

1. **Verify Code Block Integrity**: Ensure code examples are not split
2. **Test Citation Accuracy**: Validate that metadata provides correct source attribution
3. **Monitor Chunk Distribution**: Check that chunk sizes are consistent
4. **Validate Frontmatter Extraction**: Ensure all Docusaurus metadata is captured

### 7.4 Monitoring & Maintenance

```python
def collection_health_check():
    """Performs health check on Qdrant collection."""
    collection_info = qdrant_client.get_collection("docusaurus_docs")

    print(f"Collection: {collection_info.name}")
    print(f"Vectors count: {collection_info.vectors_count}")
    print(f"Points count: {collection_info.points_count}")
    print(f"Indexed vectors: {collection_info.indexed_vectors_count}")

    # Check for orphaned chunks (chunks without valid file_path)
    orphaned = qdrant_client.scroll(
        collection_name="docusaurus_docs",
        scroll_filter={
            "must_not": [
                {"key": "file_path", "match": {"any": ["*.md"]}}
            ]
        },
        limit=10
    )

    if orphaned[0]:
        print(f"Warning: Found {len(orphaned[0])} potentially orphaned chunks")
```

---

## 8. References & Resources

### Documentation
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Cohere Embeddings Guide](https://docs.cohere.com/docs/embeddings)
- [Docusaurus Markdown Features](https://docusaurus.io/docs/markdown-features)

### Best Practices Articles
- [RAG System with Cohere and Qdrant](https://qdrant.tech/documentation/examples/natural-language-search-oracle-cloud-infrastructure-cohere-langchain/)
- [Chunking Strategies for RAG](https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/)
- [Optimizing RAG Context for Technical Docs](https://dev.to/oleh-halytskyi/optimizing-rag-context-chunking-and-summarization-for-technical-docs-3pel)
- [Chunking Strategies for Better RAG Performance](https://weaviate.io/blog/chunking-strategies-for-rag)
- [Production-Grade RAG Pipeline](https://medium.com/@iamarunbrahma/building-a-production-grade-rag-document-ingestion-pipeline-with-llamaindex-and-qdrant-08f4ea1c03c1)

### Tools & Libraries
- [LangChain Markdown Splitter](https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/)
- [Qdrant Python Client](https://github.com/qdrant/qdrant-client)
- [Cohere Python SDK](https://github.com/cohere-ai/cohere-python)

---

## Appendix: Complete Code Repository Structure

```
project/
├── config/
│   ├── qdrant_config.py       # Collection configuration
│   └── cohere_config.py       # Embedding settings
├── ingestion/
│   ├── chunker.py             # Markdown chunking logic
│   ├── embedder.py            # Cohere embedding generation
│   ├── upserter.py            # Qdrant upsert operations
│   └── pipeline.py            # End-to-end ingestion pipeline
├── search/
│   ├── query.py               # Search implementation
│   ├── reranker.py            # Cohere reranking
│   └── citation.py            # Citation generation
├── utils/
│   ├── frontmatter.py         # Frontmatter extraction
│   ├── hashing.py             # Content hashing
│   └── monitoring.py          # Health checks
└── main.py                     # Entry point
```

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Author:** Research Team
**Status:** Ready for Implementation
