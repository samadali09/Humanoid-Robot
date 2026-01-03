# RAG Chatbot Quickstart Guide

## 🎯 What You Have

A fully functional **RAG-powered chatbot** integrated into your Docusaurus book with:
- ✅ Backend API (FastAPI + Qdrant + Cohere)
- ✅ Frontend Chat Widget (React + TypeScript)
- ✅ Beautiful UI with citations
- ✅ Dark mode support

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Keep this terminal running.

### Step 2: Start the Frontend

Open a **new terminal**:

```bash
npm start
```

Your browser will open to http://localhost:3000

### Step 3: Ingest Book Content

Open a **third terminal**:

```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/ingest" -Method POST -Headers @{"X-API-Key"="dev-admin-key"}

# Or using curl
curl -X POST http://localhost:8000/ingest -H "X-API-Key: dev-admin-key"
```

This will process all markdown files in the `docs/` directory and store them in Qdrant for semantic search.

## 💬 Using the Chat

1. Look for the **purple chat button (💬)** in the bottom-right corner
2. Click it to open the chat widget
3. Ask questions like:
   - "What is ROS 2?"
   - "Explain the simulation setup"
   - "How do I use Gazebo with Unity?"

## 📊 What's Working

### ✅ Completed Features (MVP - User Story 1)

- **Backend Infrastructure**
  - FastAPI server with CORS
  - Qdrant vector database integration
  - Cohere embeddings (1024 dimensions)
  - Content ingestion from markdown files
  - RAG retrieval with top-5 semantic search
  - Citations with relevance scores

- **Frontend Chat Widget**
  - Floating chat button (bottom-right)
  - Beautiful gradient UI
  - User/assistant message bubbles
  - Citation display with sources
  - Loading indicators
  - Session persistence (localStorage)
  - Dark mode support
  - Responsive design (mobile-friendly)
  - Error handling

### ⏩ Upcoming Features

- **User Story 2**: Text Selection "Explain This" (highlight text → explain)
- **User Story 3**: User Authentication (Better-Auth + profiles)
- **User Story 4**: Content Personalization (adjust complexity by expertise)
- **User Story 5**: Translation to Urdu

## 🔧 Configuration

### Backend (.env)

```bash
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your-api-key
COHERE_API_KEY=your-cohere-key
BOOK_DOCS_PATH=../docs
```

### API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /chat` - Send chat message
- `POST /ingest` - Ingest book content (admin only)

## 📝 File Structure

```
├── backend/
│   ├── main.py              # Complete backend (537 lines)
│   ├── .env                 # API keys (not in git)
│   ├── requirements.txt     # Python dependencies
│   └── test_connection.py   # Connection tests
│
├── src/
│   ├── components/
│   │   └── ChatWidget/
│   │       ├── index.tsx    # Chat component
│   │       └── styles.module.css  # Styles
│   └── theme/
│       └── Root.tsx         # Global wrapper
│
├── docs/                    # Markdown content
├── TESTING.md               # Detailed testing guide
└── QUICKSTART.md            # This file
```

## 🐛 Troubleshooting

### Chat button not visible
- Check browser console for errors
- Verify frontend started successfully
- Clear browser cache and reload

### Backend connection error
- Ensure backend is running on port 8000
- Check CORS_ORIGINS in .env includes `http://localhost:3000`
- Verify no other service is using port 8000

### No responses from chat
- Run ingestion first (Step 3 above)
- Check backend terminal for errors
- Verify Qdrant connection in backend logs

### Cohere rate limit
- Cohere free tier has request limits
- Wait a few minutes and try again
- Consider upgrading Cohere plan for production

## 📚 Next Steps

1. **Test the chat**: Follow TESTING.md for comprehensive tests
2. **Add more content**: Add markdown files to docs/ and re-run ingestion
3. **Customize UI**: Edit styles.module.css to match your brand
4. **Add features**: Implement User Stories 2-5 from tasks.md
5. **Deploy**: See deployment guide for production setup

## 🎉 Success!

You now have a working RAG chatbot! Users can:
- ✅ Ask questions about your book content
- ✅ Get accurate answers with citations
- ✅ See which chapters/sections were referenced
- ✅ Continue conversations with context

**Enjoy your intelligent book assistant!** 💜
