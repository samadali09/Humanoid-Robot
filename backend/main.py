"""
RAG Chatbot Backend - FastAPI Application
Single "God File" containing all server logic for RAG-powered Q&A,
content personalization, and translation.
"""

# ============================================================================
# IMPORTS AND CONFIGURATION
# ============================================================================
import os
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
import hashlib
from datetime import datetime

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import cohere
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RAG Chatbot and Personalization Engine",
    description="FastAPI backend for RAG-powered Q&A from Docusaurus book content",
    version="1.0.0"
)

# Add CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# GLOBAL CLIENTS
# ============================================================================

# Cohere client for embeddings
cohere_client = cohere.Client(os.getenv("COHERE_API_KEY"))

# Qdrant client for vector database
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# Collection name
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "book_content")

# Book docs path
BOOK_DOCS_PATH = Path(os.getenv("BOOK_DOCS_PATH", "../book/docs"))

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's question or message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    selected_text: Optional[str] = Field(None, description="Text selected by user for 'Explain This' feature")

class Citation(BaseModel):
    chunk_id: str
    text: str
    citation: str
    score: float

class ChatResponse(BaseModel):
    response: str
    citations: List[Citation]
    session_id: str

class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]

class IngestResponse(BaseModel):
    status: str
    chunks_processed: int
    chunks_added: int
    chunks_updated: int
    duration_seconds: float

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def compute_content_hash(text: str) -> str:
    """Compute MD5 hash of content for change detection."""
    return hashlib.md5(text.encode()).hexdigest()

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: Text to chunk
        chunk_size: Maximum chunk size in characters
        overlap: Overlap between chunks in characters

    Returns:
        List of text chunks
    """
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]

        # If this isn't the last chunk, try to break at a sentence or word boundary
        if end < text_length:
            # Look for sentence boundary
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)

            if break_point > chunk_size * 0.5:  # Only break if we're past halfway
                chunk = text[start:start + break_point + 1]
                end = start + break_point + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return chunks

def extract_markdown_metadata(file_path: Path) -> Dict[str, Any]:
    """
    Extract metadata from markdown file (frontmatter and headers).

    Args:
        file_path: Path to markdown file

    Returns:
        Dictionary containing metadata
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract first H1 as chapter title
        lines = content.split('\n')
        chapter = "Unknown Chapter"
        for line in lines:
            if line.startswith('# '):
                chapter = line[2:].strip()
                break

        return {
            "file_path": str(file_path.relative_to(BOOK_DOCS_PATH)),
            "chapter": chapter,
            "file_name": file_path.name
        }
    except Exception as e:
        logger.error(f"Error extracting metadata from {file_path}: {e}")
        return {
            "file_path": str(file_path),
            "chapter": "Unknown",
            "file_name": file_path.name
        }

async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings using Cohere.

    Args:
        texts: List of texts to embed

    Returns:
        List of embedding vectors
    """
    try:
        response = cohere_client.embed(
            texts=texts,
            model='embed-english-v3.0',
            input_type='search_document'  # For ingestion
        )
        return response.embeddings
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

async def generate_query_embedding(query: str) -> List[float]:
    """
    Generate embedding for a search query using Cohere.

    Args:
        query: Search query text

    Returns:
        Embedding vector
    """
    try:
        response = cohere_client.embed(
            texts=[query],
            model='embed-english-v3.0',
            input_type='search_query'  # For queries
        )
        return response.embeddings[0]
    except Exception as e:
        logger.error(f"Error generating query embedding: {e}")
        raise HTTPException(status_code=500, detail=f"Query embedding failed: {str(e)}")

# ============================================================================
# INGESTION UTILITIES
# ============================================================================

async def ingest_markdown_files(force_reindex: bool = False) -> IngestResponse:
    """
    Ingest markdown files from book/docs into Qdrant.

    Args:
        force_reindex: If True, re-index even if content hash hasn't changed

    Returns:
        IngestResponse with statistics
    """
    start_time = datetime.now()
    chunks_processed = 0
    chunks_added = 0
    chunks_updated = 0

    try:
        # Ensure collection exists
        try:
            qdrant_client.get_collection(COLLECTION_NAME)
            logger.info(f"Collection '{COLLECTION_NAME}' already exists")
        except Exception:
            logger.info(f"Creating collection '{COLLECTION_NAME}'")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=1024,  # Cohere embed-english-v3.0 dimension
                    distance=Distance.COSINE
                )
            )

        # Find all markdown files
        markdown_files = list(BOOK_DOCS_PATH.rglob("*.md"))
        logger.info(f"Found {len(markdown_files)} markdown files")

        for md_file in markdown_files:
            try:
                # Read file content
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Skip empty files
                if not content.strip():
                    continue

                # Extract metadata
                metadata = extract_markdown_metadata(md_file)

                # Chunk the content
                chunks = chunk_text(content, chunk_size=500, overlap=50)

                # Generate embeddings in batches
                embeddings = await generate_embeddings(chunks)

                # Prepare points for Qdrant
                points = []
                for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    chunk_id = f"{metadata['file_name']}_chunk_{idx}"
                    content_hash = compute_content_hash(chunk)

                    point = PointStruct(
                        id=chunk_id,
                        vector=embedding,
                        payload={
                            "text": chunk,
                            "chunk_id": chunk_id,
                            "chunk_index": idx,
                            "total_chunks": len(chunks),
                            "file_path": metadata["file_path"],
                            "chapter": metadata["chapter"],
                            "file_name": metadata["file_name"],
                            "content_hash": content_hash,
                            "citation": f"{metadata['chapter']}",
                            "last_updated": datetime.now().isoformat()
                        }
                    )
                    points.append(point)
                    chunks_processed += 1

                # Upsert points to Qdrant
                qdrant_client.upsert(
                    collection_name=COLLECTION_NAME,
                    points=points
                )
                chunks_added += len(points)

                logger.info(f"Ingested {len(points)} chunks from {md_file.name}")

            except Exception as e:
                logger.error(f"Error processing {md_file}: {e}")
                continue

        duration = (datetime.now() - start_time).total_seconds()

        return IngestResponse(
            status="success",
            chunks_processed=chunks_processed,
            chunks_added=chunks_added,
            chunks_updated=chunks_updated,
            duration_seconds=duration
        )

    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

# ============================================================================
# RAG RETRIEVAL
# ============================================================================

async def retrieve_context(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve relevant context chunks from Qdrant.

    Args:
        query: User's search query
        top_k: Number of chunks to retrieve

    Returns:
        List of retrieved chunks with metadata
    """
    try:
        # Generate query embedding
        query_embedding = await generate_query_embedding(query)

        # Search Qdrant
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=top_k
        )

        # Format results
        contexts = []
        for result in search_results:
            contexts.append({
                "chunk_id": result.payload.get("chunk_id"),
                "text": result.payload.get("text"),
                "citation": result.payload.get("citation"),
                "score": result.score,
                "chapter": result.payload.get("chapter"),
                "file_path": result.payload.get("file_path")
            })

        return contexts

    except Exception as e:
        logger.error(f"Context retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Context retrieval failed: {str(e)}")

# ============================================================================
# CHAT ENDPOINT
# ============================================================================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    RAG-powered Q&A endpoint.

    Retrieves relevant context from the book and generates an answer.
    """
    try:
        # Build query (include selected text if provided)
        query = request.message
        if request.selected_text:
            query = f"Regarding this text: '{request.selected_text}'\n\nQuestion: {request.message}"

        # Retrieve context
        contexts = await retrieve_context(query, top_k=5)

        if not contexts:
            return ChatResponse(
                response="I couldn't find relevant information in the book to answer your question. Please try rephrasing or ask about topics covered in the book.",
                citations=[],
                session_id=request.session_id or "default"
            )

        # Build response with citations
        response_text = "Based on the book content:\n\n"

        # Add context summaries
        for ctx in contexts[:3]:  # Top 3 results
            response_text += f"- {ctx['text'][:200]}...\n\n"

        response_text += "\nSources:\n"
        for ctx in contexts[:3]:
            response_text += f"- {ctx['citation']}\n"

        # Format citations
        citations = [
            Citation(
                chunk_id=ctx["chunk_id"],
                text=ctx["text"][:200],
                citation=ctx["citation"],
                score=ctx["score"]
            )
            for ctx in contexts
        ]

        return ChatResponse(
            response=response_text,
            citations=citations,
            session_id=request.session_id or "default"
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.post("/ingest", response_model=IngestResponse)
async def ingest(
    force_reindex: bool = False,
    x_api_key: Optional[str] = Header(None)
):
    """
    Trigger book content ingestion into Qdrant.

    Requires admin API key in X-API-Key header.
    """
    # Simple API key check (in production, use proper auth)
    admin_key = os.getenv("ADMIN_API_KEY", "dev-admin-key")
    if x_api_key != admin_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return await ingest_markdown_files(force_reindex=force_reindex)

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    services = {
        "qdrant": "unknown",
        "cohere": "unknown"
    }

    # Check Qdrant
    try:
        qdrant_client.get_collections()
        services["qdrant"] = "connected"
    except Exception as e:
        services["qdrant"] = f"disconnected: {str(e)}"
        logger.error(f"Qdrant health check failed: {e}")

    # Check Cohere
    try:
        # Simple check - just verify client is configured
        if cohere_client.api_key:
            services["cohere"] = "configured"
    except Exception as e:
        services["cohere"] = f"error: {str(e)}"
        logger.error(f"Cohere health check failed: {e}")

    status = "healthy" if all(s in ["connected", "configured"] for s in services.values()) else "degraded"

    return HealthResponse(
        status=status,
        version="1.0.0",
        services=services
    )

# ============================================================================
# STARTUP / SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info("Starting RAG Chatbot Backend...")
    logger.info(f"Qdrant URL: {os.getenv('QDRANT_URL')}")
    logger.info(f"Collection: {COLLECTION_NAME}")
    logger.info(f"Book docs path: {BOOK_DOCS_PATH}")

    # Check if collection exists, create if not
    try:
        qdrant_client.get_collection(COLLECTION_NAME)
        logger.info(f"Collection '{COLLECTION_NAME}' exists")
    except Exception:
        logger.warning(f"Collection '{COLLECTION_NAME}' does not exist. Run /ingest to create it.")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("Shutting down RAG Chatbot Backend...")

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "RAG Chatbot and Personalization Engine",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
