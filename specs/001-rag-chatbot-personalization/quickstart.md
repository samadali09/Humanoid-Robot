# Quickstart Guide: RAG Chatbot and Personalization Engine

**Feature**: 001-rag-chatbot-personalization
**Last Updated**: 2026-01-03

This guide will help you set up and run the RAG Chatbot and Personalization Engine locally for development.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **uv** (Python package manager): `pip install uv`
- **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Required API Keys

You'll need the following accounts and API keys:

1. **OpenAI API Key**
   - Sign up at [https://platform.openai.com](https://platform.openai.com)
   - Create an API key from the dashboard
   - Minimum $5 deposit recommended for meaningful rate limits

2. **Qdrant Cloud Account**
   - Sign up at [https://cloud.qdrant.io](https://cloud.qdrant.io)
   - Create a free cluster (1GB storage)
   - Get cluster URL and API key from dashboard

3. **Cohere API Key** (Optional - for embeddings)
   - Sign up at [https://cohere.com](https://cohere.com)
   - Get free API key (1,000 calls/month)

---

## Step 1: Clone the Repository

```bash
cd C:\Users\classic computer 220\Desktop\hacakathon-11
git checkout 001-rag-chatbot-personalization
```

---

## Step 2: Backend Setup

### 2.1 Create Backend Directory and Initialize

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize uv project
uv init

# Specify Python version
echo "3.11" > .python-version
```

### 2.2 Install Dependencies

```bash
uv add fastapi uvicorn cohere qdrant-client psycopg[binary] python-dotenv pydantic httpx pytest pytest-asyncio
```

This installs:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `cohere` - Embeddings API client
- `qdrant-client` - Vector database client
- `psycopg[binary]` - PostgreSQL adapter
- `python-dotenv` - Environment variable management
- `pydantic` - Data validation
- `httpx` - HTTP client for OpenAI
- `pytest`, `pytest-asyncio` - Testing frameworks

### 2.3 Configure Environment Variables

Create `backend/.env` file:

```bash
# Copy template
cp .env.example .env

# Edit with your actual values
nano .env  # or use your preferred editor
```

```.env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...your-key-here

# Qdrant Configuration
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=book_content

# Cohere Configuration (for embeddings)
COHERE_API_KEY=your-cohere-api-key

# PostgreSQL Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/rag_chatbot

# Redis Configuration (optional - for production)
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-min-32-chars
ADMIN_API_KEY=your-admin-api-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Application Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**Generate secure keys**:
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Generate ADMIN_API_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.4 Setup PostgreSQL Database

```bash
# Create database
createdb rag_chatbot

# Or using psql
psql -U postgres
CREATE DATABASE rag_chatbot;
\q
```

### 2.5 Create Database Schema

Run the SQL schema from `data-model.md`:

```bash
psql -U postgres -d rag_chatbot -f ../specs/001-rag-chatbot-personalization/schema.sql
```

Or manually in psql:
```sql
-- Copy and paste the SQL from data-model.md sections 1-5
```

---

## Step 3: Frontend Setup (Docusaurus)

### 3.1 Navigate to Book Directory

```bash
cd ../book  # or wherever your Docusaurus site is located
```

### 3.2 Install Dependencies

```bash
npm install

# Install additional dependencies for auth and chat
npm install better-auth @tanstack/react-query axios
```

### 3.3 Configure Environment Variables

Create `book/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Better-Auth Configuration
BETTER_AUTH_SECRET=your-cryptographically-secure-secret-min-32-chars
DATABASE_URL=postgresql://user:password@localhost:5432/rag_chatbot
```

Generate `BETTER_AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Initialize Better-Auth

Run the Better-Auth CLI to create database tables:

```bash
npx @better-auth/cli generate
```

This creates the `user`, `session`, `account`, and `verification` tables.

---

## Step 4: Run Content Ingestion

Before starting the servers, ingest your book content into Qdrant.

### 4.1 Start Backend Server

```bash
cd ../backend
uv run uvicorn main:app --reload --port 8000
```

### 4.2 Trigger Ingestion

In a new terminal:

```bash
# Using curl
curl -X POST http://localhost:8000/ingest \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{"force_reindex": false}'

# Or using httpie (if installed)
http POST localhost:8000/ingest X-API-Key:your-admin-api-key force_reindex:=false
```

Expected output:
```json
{
  "status": "success",
  "chunks_processed": 523,
  "chunks_added": 523,
  "chunks_updated": 0,
  "duration_seconds": 28.5
}
```

**Note**: Ingestion may take 30-60 seconds depending on book size and API rate limits.

---

## Step 5: Start Development Servers

### 5.1 Start Backend (if not already running)

```bash
cd backend
uv run uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 5.2 Start Frontend

In a new terminal:

```bash
cd book
npm start
```

You should see:
```
[INFO] Starting the development server...
[SUCCESS] Docusaurus website is running at: http://localhost:3000/
```

---

## Step 6: Test the Integration

### 6.1 Verify API Health

Open [http://localhost:8000/health](http://localhost:8000/health) in your browser.

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "qdrant": "connected",
    "openai": "accessible"
  }
}
```

### 6.2 Test Chat Functionality

1. Open [http://localhost:3000](http://localhost:3000)
2. Navigate to any chapter
3. Look for the chat widget (usually bottom-right corner)
4. Click to open the chat interface
5. Ask a question: "What is ROS 2?"
6. Verify you receive a response with citations

### 6.3 Test User Authentication

1. Click "Sign Up" in the navigation bar
2. Fill in the registration form:
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Name: `Test User`
   - Background Level: `Intermediate`
   - Expertise Areas: Select 2-3 areas
3. Click "Sign Up"
4. Verify you're redirected to the dashboard
5. Check that your profile information is displayed

### 6.4 Test Personalization

1. Log in (if not already logged in)
2. Navigate to any chapter
3. Click the "Personalize Chapter" button
4. Wait ~3-5 seconds
5. Verify the content is adapted to your background level
6. Click "Reset to Original" to restore original content

### 6.5 Test Translation

1. Navigate to any chapter
2. Click the "Translate to Urdu" button
3. Wait ~5-8 seconds
4. Verify the content is translated (text in Urdu, code unchanged)
5. Click "Back to English" to restore original content

### 6.6 Test Text Selection "Explain This"

1. Navigate to any chapter
2. Select a paragraph of text with your mouse
3. Look for the "Explain This" button that appears above the selection
4. Click the button
5. Verify the chat opens with your selected text as context
6. Verify the response focuses on explaining the selected text

---

## Step 7: Run Tests

### 7.1 Backend Tests

```bash
cd backend
uv run pytest tests/ -v
```

Expected output:
```
tests/test_ingestion.py::test_chunk_markdown PASSED
tests/test_rag.py::test_retrieve_context PASSED
tests/test_auth.py::test_signup PASSED
tests/test_auth.py::test_login PASSED
tests/test_personalization.py::test_personalize PASSED
tests/test_translation.py::test_translate PASSED

===== 6 passed in 2.5s =====
```

### 7.2 Frontend Tests

```bash
cd ../book
npm test
```

---

## Troubleshooting

### Issue: "Connection refused" when accessing backend

**Solution**:
- Ensure backend server is running: `uv run uvicorn main:app --reload`
- Check if port 8000 is available: `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows)
- Verify CORS_ORIGINS includes your frontend URL

### Issue: "Qdrant connection failed"

**Solution**:
- Verify Qdrant Cloud cluster is running
- Check QDRANT_URL and QDRANT_API_KEY in `.env`
- Test connection: `curl -H "api-key: YOUR_KEY" https://your-cluster.qdrant.io/collections`

### Issue: "OpenAI API rate limit exceeded"

**Solution**:
- Check your OpenAI account has sufficient credits
- Verify you're on at least Tier 1 (requires $5 deposit)
- Implement caching to reduce API calls (personalization and translation already cached)

### Issue: "Database connection error"

**Solution**:
- Ensure PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` is correct
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`
- Check database exists: `psql -U postgres -l`

### Issue: "Better-Auth errors during signup"

**Solution**:
- Ensure Better-Auth tables were created: `npx @better-auth/cli generate`
- Verify BETTER_AUTH_SECRET is set in `.env.local`
- Check browser console for detailed error messages

### Issue: "Chat not responding" or "Empty responses"

**Solution**:
- Verify ingestion completed successfully (check `/health` endpoint)
- Check browser network tab for API errors
- Ensure OPENAI_API_KEY is valid and has credits
- Check backend logs for detailed error messages

### Issue: "Text selection not working"

**Solution**:
- Ensure you're selecting text within markdown content (not in navigation/footer)
- Check browser console for JavaScript errors
- Verify the `useTextSelection` hook is properly initialized in Root component

---

## Next Steps

After successfully running the application locally:

1. **Explore the API**: Visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API documentation (Swagger UI)
2. **Review the Code**: Read through `backend/main.py` to understand the implementation
3. **Customize**: Modify prompts, adjust chunk sizes, or add new features
4. **Deploy**: Follow deployment guides for Railway (backend) and Vercel (frontend)
5. **Monitor**: Set up logging and monitoring for production use

---

## Development Tips

### Hot Reload

Both servers support hot reload:
- **Backend**: Uvicorn automatically reloads on code changes
- **Frontend**: Docusaurus automatically rebuilds on file changes

### Debugging

**Backend**:
```bash
# Run with debugger
uv run python -m pdb main.py

# Or use logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend**:
- Use browser DevTools (F12)
- Check React DevTools extension
- Enable source maps for better debugging

### API Testing

Use the Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs) to test API endpoints interactively.

Or use command-line tools:

```bash
# Test chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is ROS 2?",
    "sessionId": "test-session-123"
  }'

# Test personalization
curl -X POST http://localhost:8000/personalize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"chapterId": "chapter-2-ros2-basics"}'
```

### Database Management

```bash
# View users
psql $DATABASE_URL -c "SELECT id, email, name, background_level FROM users;"

# View chat messages
psql $DATABASE_URL -c "SELECT session_id, role, LEFT(content, 50) FROM chat_messages ORDER BY created_at DESC LIMIT 10;"

# Clear cache tables
psql $DATABASE_URL -c "DELETE FROM personalization_cache; DELETE FROM translation_cache;"
```

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [API documentation](http://localhost:8000/docs)
2. Review the [data model](./data-model.md) for schema details
3. Consult the [research findings](./research.md) for architectural decisions
4. Check backend logs: `tail -f backend/logs/app.log`
5. Open an issue on the project repository

---

## Summary

You've now set up a complete RAG-powered chatbot with:
- ✅ Backend API running on port 8000
- ✅ Frontend Docusaurus site running on port 3000
- ✅ PostgreSQL database for user profiles and cache
- ✅ Qdrant vector database with book content embeddings
- ✅ OpenAI integration for chat, personalization, and translation
- ✅ Better-Auth for user authentication
- ✅ All features tested and working

**Estimated setup time**: 30-45 minutes (excluding API key approvals)

Ready to proceed with implementation? Run `/sp.tasks` to break down the work into granular, testable tasks.
