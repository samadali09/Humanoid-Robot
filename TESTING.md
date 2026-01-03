# Testing the RAG Chatbot

## Quick Start

### 1. Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. Start the Frontend (in a new terminal)

```bash
cd C:\Users\classic computer 220\Desktop\hacakathon-11
npm start
```

**Expected output:**
```
Starting the development server...
[SUCCESS] Docusaurus website is running at: http://localhost:3000/
```

### 3. Ingest Book Content

Before chatting, you need to ingest the book content into Qdrant:

```bash
curl -X POST http://localhost:8000/ingest -H "X-API-Key: dev-admin-key"
```

**Or using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/ingest" -Method POST -Headers @{"X-API-Key"="dev-admin-key"}
```

**Expected response:**
```json
{
  "status": "success",
  "chunks_processed": 150,
  "chunks_added": 150,
  "chunks_updated": 0,
  "duration_seconds": 12.5
}
```

### 4. Test the Chat Widget

1. Open http://localhost:3000 in your browser
2. Look for the purple chat button (💬) in the bottom-right corner
3. Click it to open the chat widget
4. Try these test questions:

#### Test Questions

**Basic Query:**
```
What is ROS 2?
```

**Multi-chapter Query:**
```
How do I set up a simulation environment?
```

**Unrelated Query (should politely decline):**
```
What's the weather today?
```

## Expected Behavior

### ✅ Success Criteria

1. **Chat Widget Visible**: Purple button appears bottom-right
2. **Opens/Closes**: Clicking button toggles chat window
3. **Message Display**: User and assistant messages appear in bubbles
4. **Citations Shown**: Assistant responses include "Sources:" section
5. **Response Time**: < 3 seconds for typical queries
6. **Error Handling**: Graceful error messages if backend is down
7. **Session Persistence**: Conversation continues across messages

### ⚠️ Common Issues

#### Backend Not Running
**Symptom:** Chat returns error "make sure backend server is running"
**Solution:** Start backend with `uvicorn main:app --reload --port 8000`

#### Collection Not Found
**Symptom:** Backend returns "collection not found" error
**Solution:** Run ingestion endpoint first (see step 3)

#### CORS Error
**Symptom:** Browser console shows CORS error
**Solution:** Verify `CORS_ORIGINS` in backend/.env includes `http://localhost:3000`

#### No Content to Ingest
**Symptom:** Ingestion returns 0 chunks
**Solution:** Verify markdown files exist in `docs/` directory

## Integration Tests (Manual)

### Test 1: User Story 1 - AS1
**Scenario:** Ask "What is ROS 2?" on any page
**Expected:**
- Response within 3 seconds
- Answer includes relevant information
- Citations show source chapters/sections

### Test 2: User Story 1 - AS2
**Scenario:** Ask question spanning multiple chapters
**Expected:**
- Aggregated answer from multiple sources
- Multiple citations shown

### Test 3: User Story 1 - AS3
**Scenario:** Ask unrelated question
**Expected:**
- Polite "not covered in the book" message
- No hallucinated information

## API Testing (Optional)

### Test Health Endpoint
```bash
curl http://localhost:8000/health
```

**Expected:**
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

### Test Chat Endpoint Directly
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ROS 2?"}'
```

**Expected:**
```json
{
  "response": "ROS 2 (Robot Operating System 2) is...",
  "citations": [
    {
      "chunk_id": "...",
      "text": "...",
      "citation": "Chapter 1: Introduction to ROS 2",
      "score": 0.85
    }
  ],
  "session_id": "..."
}
```

## Performance Testing

### Response Time Test
Use browser DevTools Network tab to measure:
- Target: < 3 seconds (95th percentile)
- Typical: 1-2 seconds

### Concurrent Users Test
Open 5+ browser tabs and send simultaneous queries:
- Target: Handle 100 concurrent users
- No errors or significant slowdown

## Next Steps After Testing

If all tests pass:
1. ✅ Phase 3 (User Story 1) complete
2. 🎯 Ready for Phase 4 (User Story 2 - Text Selection)
3. 🚀 Can proceed with additional features

If tests fail:
1. Check error logs in backend terminal
2. Verify API keys in backend/.env
3. Ensure all dependencies installed
4. Check CORS configuration
