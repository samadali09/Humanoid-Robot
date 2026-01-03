# RAG Chatbot Backend

FastAPI backend for RAG-powered Q&A using Qdrant Cloud and Cohere embeddings.

## Quick Start

### 1. Install Dependencies

```bash
# Using pip
pip install -r requirements.txt

# Or using uv (recommended)
uv pip install -r requirements.txt
```

### 2. Test Connections

```bash
python test_connection.py
```

You should see:
```
✅ Qdrant connection successful!
✅ Cohere connection successful!
```

### 3. Start the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Or run directly
python main.py
```

### 4. Verify Server is Running

Open http://localhost:8000 in your browser. You should see:
```json
{
  "name": "RAG Chatbot and Personalization Engine",
  "version": "1.0.0",
  "status": "running"
}
```

### 5. Check Health

Visit http://localhost:8000/health or:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "qdrant": "connected",
    "cohere": "configured"
  }
}
```

### 6. Ingest Book Content

```bash
# Using curl
curl -X POST http://localhost:8000/ingest \
  -H "X-API-Key: dev-admin-key"

# Or using Python requests
python -c "import requests; print(requests.post('http://localhost:8000/ingest', headers={'X-API-Key': 'dev-admin-key'}).json())"
```

**Note**: Make sure you have markdown files in `../book/docs/` directory.

### 7. Test Chat

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ROS 2?"}'
```

## API Endpoints

### Health Check
- **GET** `/health` - Check service health

### Ingestion
- **POST** `/ingest` - Ingest book content into Qdrant
  - Header: `X-API-Key: dev-admin-key`
  - Body: `{"force_reindex": false}`

### Chat
- **POST** `/chat` - Ask questions about the book
  - Body: `{"message": "Your question", "selected_text": "optional highlighted text"}`

## Interactive API Documentation

Visit http://localhost:8000/docs for Swagger UI with interactive API testing.

## Configuration

All configuration is in `.env` file:

```env
# Qdrant Configuration
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your-api-key
QDRANT_COLLECTION=book_content

# Cohere Configuration
COHERE_API_KEY=your-cohere-api-key

# Application Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
```

## Troubleshooting

### Error: "Collection not found"
Run the ingestion endpoint to create the collection:
```bash
curl -X POST http://localhost:8000/ingest -H "X-API-Key: dev-admin-key"
```

### Error: "No module named 'cohere'"
Install dependencies:
```bash
pip install -r requirements.txt
```

### Error: "Connection refused"
Make sure Qdrant URL and API key are correct in `.env` file.

## Development

The entire backend is in `main.py` (the "God File" as requested). Key sections:

- **Imports & Config** (lines 1-60)
- **Global Clients** (lines 61-80)
- **Pydantic Models** (lines 81-120)
- **Utility Functions** (lines 121-200)
- **Ingestion Logic** (lines 201-350)
- **RAG Retrieval** (lines 351-400)
- **Chat Endpoint** (lines 401-450)
- **Admin Endpoints** (lines 451-500)
- **Startup/Shutdown** (lines 501-550)

## Next Steps

1. Add OpenAI API key to `.env` for LLM-powered responses (currently using simple context concatenation)
2. Implement user authentication endpoints
3. Add personalization and translation endpoints
4. Deploy to Railway or similar platform

## Testing

```bash
# Test connection
python test_connection.py

# Start server
uvicorn main:app --reload

# In another terminal, test endpoints
curl http://localhost:8000/health
curl -X POST http://localhost:8000/ingest -H "X-API-Key: dev-admin-key"
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message": "test"}'
```
