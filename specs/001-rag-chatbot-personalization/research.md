# Research Findings: RAG Chatbot and Personalization Engine

**Feature**: 001-rag-chatbot-personalization
**Date**: 2026-01-03
**Status**: Complete

## Overview

This document consolidates research findings from Phase 0 of the implementation plan. All technical unknowns have been resolved with decisions, rationale, and alternatives considered.

---

## Decision 1: OpenAI API Integration Pattern

### Decision
Use **OpenAI Chat Completions API with FastAPI StreamingResponse** for the RAG chatbot.

### Rationale
- Chat Completions API is the industry standard with long-term support
- Assistants API is being sunset in H1 2026 (announced by OpenAI)
- Full control over RAG retrieval logic and conversation context
- Better cost-effectiveness for high-volume applications
- Simpler implementation without Assistant/Thread overhead

### Implementation Pattern
```python
# FastAPI + AsyncOpenAI + Server-Sent Events
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

async def generate_stream(messages: list[dict]):
    client = AsyncOpenAI()
    stream = await client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        stream=True
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield f"data: {chunk.choices[0].delta.content}\\n\\n"
```

### Conversation History Management
**Hybrid approach**: Redis for active sessions + PostgreSQL for long-term storage
- Redis: Sub-millisecond latency for active sessions (1 hour TTL)
- PostgreSQL: Durable persistence for conversation history
- Sliding window + summarization for context window management

### Alternatives Considered
- **Assistants API**: Rejected due to upcoming deprecation and less control
- **LangChain**: Adds complexity and slower than direct OpenAI calls
- **WebSockets**: More complex than SSE, proxy compatibility issues

---

## Decision 2: Qdrant Cloud Configuration

### Decision
Use Qdrant Cloud with the following configuration:
- **Vector dimensions**: 1536 (OpenAI text-embedding-3-small)
- **Distance metric**: Cosine similarity
- **Chunk size**: 400-512 tokens with 50-80 token overlap
- **Collection structure**: Single collection with metadata-based filtering

### Rationale
- Qdrant Cloud free tier provides 1GB storage (sufficient for 15-20K word book)
- Cosine similarity optimal for semantic search
- 400-512 token chunks balance context preservation with retrieval precision
- Metadata structure enables accurate citations

### Qdrant Collection Schema
```python
from qdrant_client.models import Distance, VectorParams

client.create_collection(
    collection_name="book_content",
    vectors_config=VectorParams(
        size=1536,  # OpenAI text-embedding-3-small
        distance=Distance.COSINE
    )
)
```

### Metadata Schema
Each vector point includes:
- `file_path`: Source markdown file path
- `chapter`: Chapter title from H1
- `section`: Section title from H2/H3
- `chunk_id`: Unique identifier
- `chunk_index`: Position in document
- `content_type`: text, code_block, or mixed
- `citation`: Formatted citation string
- `last_updated`: Timestamp for incremental updates

### Chunking Strategy
- Split on markdown headers (H2/H3 boundaries)
- Preserve code blocks intact (critical for technical documentation)
- Extract Docusaurus frontmatter separately
- Maintain hierarchical context through metadata

### Incremental Updates
- Hash-based change detection using document content MD5
- Upsert only modified chunks
- Batch processing (32-96 items) for efficiency

### Alternatives Considered
- **Pinecone**: More expensive, less control over deployment
- **Weaviate**: Requires more setup, overkill for this scale
- **ChromaDB**: Good for local dev but Qdrant Cloud better for production

---

## Decision 3: Better-Auth Integration with Docusaurus

### Decision
Use **Root component swizzling** pattern with Better-Auth for authentication.

### Rationale
- Root component renders at top of React tree and never unmounts
- Perfect for persistent auth state across navigation
- No conflicts with Docusaurus routing
- TypeScript-first with excellent DX

### Implementation Pattern
```typescript
// src/theme/Root.tsx
import { AuthProvider } from '@site/src/components/AuthProvider';

export default function Root({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### Auth State Management
- Use React Context for auth state (via Better-Auth's useSession hook)
- No external state library needed
- Auth state persists across page navigations
- Automatic session refresh handled by Better-Auth

### User Profile Schema
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  backgroundLevel: 'beginner' | 'intermediate' | 'advanced';
  expertiseAreas: string[]; // ['AI/ML', 'Robotics', 'Control Systems']
  createdAt: Date;
  lastLogin: Date;
}
```

### Redirects Without Breaking Routing
- Use `@docusaurus/router` for all navigation
- Better-Auth's client-side auth prevents full page reloads
- `callbackURL` parameter for post-auth redirects

### Alternatives Considered
- **Firebase Auth**: Heavier, requires Firebase SDK
- **Auth0**: More expensive, complex for simple email/password
- **NextAuth.js**: Not designed for Docusaurus (Next.js specific)

---

## Decision 4: Embedding Model Selection

### Decision
Use **OpenAI text-embedding-3-small** for production embeddings.

### Rationale
- **Cost**: $0.02 per 1M tokens (6-20x cheaper than Cohere)
- **Performance**: 75.8% accuracy, sufficient for technical docs
- **Production-ready**: Best overall model according to benchmarks
- **Budget**: $0.004 to embed entire 200K token book

### Cost Comparison
| Model | Price per 1M tokens | Book embedding cost | Monthly queries (10K tokens) |
|-------|---------------------|---------------------|------------------------------|
| OpenAI text-embedding-3-small | $0.02 | $0.004 | $0.0002/month |
| OpenAI text-embedding-3-large | $0.13 | $0.026 | $0.0013/month |
| Cohere embed-v3.0 | $0.40 | $0.080 | $0.0040/month |
| Cohere embed-v4.0 | $0.12 | $0.024 | $0.0012/month |

### Implementation
```python
from openai import OpenAI

client = OpenAI()
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=["Your text to embed"],
    encoding_format="float"
)
embedding = response.data[0].embedding  # 1536 dimensions
```

### Alternatives Considered
- **Cohere embed-v3.0**: Higher quality but 20x more expensive
- **Cohere trial API**: Good for prototyping but only 1,000 calls/month
- **Code-specific models**: Overkill for mixed technical prose + code

---

## Decision 5: Content Personalization Strategy

### Decision
Use **single-pass LLM rewriting** with prompt engineering for content personalization.

### Rationale
- Simpler implementation than multi-step processing
- Fast enough to meet 5-second SC-005 requirement
- Preserves markdown structure with proper prompting
- Can cache results per user + chapter combination

### Personalization Algorithm
```python
async def personalize_content(
    chapter_content: str,
    user_background: str,
    expertise_areas: list[str]
) -> str:
    prompt = f"""
    You are a technical content editor. Adapt this chapter for a {user_background}
    reader with expertise in {', '.join(expertise_areas)}.

    For beginners: Add analogies, explain terminology, provide more context
    For advanced: Condense basics, emphasize edge cases and advanced implications

    CRITICAL: Preserve all markdown formatting, code blocks, and citations.

    Chapter content:
    {chapter_content}
    """

    response = await openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3  # Low temperature for consistent formatting
    )

    return response.choices[0].message.content
```

### Caching Strategy
- Key: `personalization:{user_id}:{chapter_id}:{background_level}`
- TTL: 1 hour (balance freshness vs. cost)
- Storage: Redis for speed

### Alternatives Considered
- **Multi-step processing**: More expensive and slower
- **Pre-generated versions**: Storage intensive, doesn't account for expertise areas
- **Client-side adaptation**: Would expose prompts and API keys

---

## Decision 6: Translation Implementation

### Decision
Use **OpenAI GPT-4 with translation-specific prompts** for Urdu translation.

### Rationale
- GPT-4 has strong multilingual capabilities including Urdu
- Can preserve markdown formatting and code blocks with proper prompting
- Single API (OpenAI) for both chat and translation simplifies architecture
- Meets 8-second SC-006 requirement

### Translation Algorithm
```python
async def translate_content(
    chapter_content: str,
    target_language: str = "Urdu"
) -> str:
    prompt = f"""
    Translate this technical documentation chapter to {target_language}.

    CRITICAL RULES:
    1. Preserve ALL markdown formatting (headers, lists, links)
    2. Keep code blocks UNCHANGED (do not translate code)
    3. Translate code comments but keep variable names in English
    4. For technical terms without clear translations, keep English term and
       add Urdu explanation in parentheses
    5. Preserve all citations and references

    Chapter content:
    {chapter_content}
    """

    response = await openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return response.choices[0].message.content
```

### Caching Strategy
- Key: `translation:{chapter_id}:{language}`
- TTL: 24 hours (translations don't change as frequently)
- Storage: Redis or PostgreSQL (translations are larger)

### Technical Term Handling
- Keep English terms for: ROS 2, Gazebo, NVIDIA Isaac, API names
- Translate explanatory text and concepts
- Example: "ROS 2 Node (ROS 2 نوڈ)" with Urdu explanation

### Alternatives Considered
- **Google Translate API**: Less context-aware, poor handling of technical content
- **Dedicated translation services**: Additional API, more complexity
- **Pre-translated versions**: Maintenance burden, version skew issues

---

## Decision 7: PostgreSQL Schema Design

### Decision
Use the following PostgreSQL schema for user profiles, sessions, and cache.

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    background_level VARCHAR(50) DEFAULT 'beginner',
    expertise_areas JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    INDEX idx_email (email)
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);
```

#### Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    context_chunks JSONB, -- Retrieved RAG context
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

#### Personalization Cache Table
```sql
CREATE TABLE personalization_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(255) NOT NULL,
    background_level VARCHAR(50) NOT NULL,
    personalized_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, chapter_id, background_level),
    INDEX idx_user_chapter (user_id, chapter_id),
    INDEX idx_expires_at (expires_at)
);
```

#### Translation Cache Table
```sql
CREATE TABLE translation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id VARCHAR(255) NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    translated_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(chapter_id, source_language, target_language),
    INDEX idx_chapter_lang (chapter_id, target_language),
    INDEX idx_expires_at (expires_at)
);
```

### Rationale
- UUIDs for primary keys (better for distributed systems)
- JSONB for flexible arrays (expertise_areas, context_chunks)
- Proper indexing for common query patterns
- ON DELETE CASCADE for session cleanup
- Separate cache tables for TTL management

### Alternatives Considered
- **MongoDB**: Less structured, but not needed given clear schema
- **Sessions in Redis only**: Risk of data loss, but acceptable for sessions
- **Normalized expertise_areas**: Over-engineering for this use case

---

## Decision 8: FastAPI Single-File Architecture

### Decision
Organize `main.py` using **functional sections with clear comments** rather than classes.

### Rationale
- Single file as requested by user ("God File")
- Functional approach is more testable than large classes
- Clear section markers make navigation easy
- Python convention for FastAPI apps

### File Organization Pattern
```python
# main.py (~1000-1500 lines)

# ============================================================================
# IMPORTS AND CONFIGURATION
# ============================================================================
from fastapi import FastAPI, HTTPException
from openai import AsyncOpenAI
# ... more imports

app = FastAPI()
config = load_config()

# ============================================================================
# DATABASE SETUP
# ============================================================================
def get_db_connection():
    ...

# ============================================================================
# MODELS (Pydantic)
# ============================================================================
class ChatRequest(BaseModel):
    ...

class UserProfile(BaseModel):
    ...

# ============================================================================
# DEPENDENCIES
# ============================================================================
async def get_current_user(token: str):
    ...

# ============================================================================
# INGESTION UTILITIES
# ============================================================================
async def chunk_markdown(content: str):
    ...

async def generate_embeddings(texts: list[str]):
    ...

# ============================================================================
# RAG UTILITIES
# ============================================================================
async def retrieve_context(query: str):
    ...

# ============================================================================
# AUTH ENDPOINTS
# ============================================================================
@app.post("/auth/signup")
async def signup(request: SignupRequest):
    ...

@app.post("/auth/login")
async def login(request: LoginRequest):
    ...

# ============================================================================
# CHAT ENDPOINTS
# ============================================================================
@app.post("/chat")
async def chat(request: ChatRequest):
    ...

# ============================================================================
# PERSONALIZATION ENDPOINTS
# ============================================================================
@app.post("/personalize")
async def personalize(request: PersonalizeRequest):
    ...

# ============================================================================
# TRANSLATION ENDPOINTS
# ============================================================================
@app.post("/translate")
async def translate(request: TranslateRequest):
    ...

# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================
@app.post("/ingest")
async def ingest(admin_key: str):
    ...

# ============================================================================
# STARTUP / SHUTDOWN
# ============================================================================
@app.on_event("startup")
async def startup_event():
    ...

@app.on_event("shutdown")
async def shutdown_event():
    ...
```

### Testing Strategy
- Extract core logic into pure functions
- Mock external services (OpenAI, Qdrant, DB)
- Test each endpoint independently

### Alternatives Considered
- **Class-based organization**: More OOP-like but less idiomatic for FastAPI
- **Multiple files with imports**: User specified single file
- **FastAPI dependencies for shared logic**: Good for modularity but increases complexity

---

## Decision 9: Deployment Strategy

### Decision
Deploy backend on **Railway** (serverless) and frontend on **Vercel** (static).

### Rationale
- Railway: Excellent FastAPI support, simple deployment, $5/month credit
- Vercel: Free tier for Docusaurus static sites, excellent DX
- Separation allows independent scaling
- Both support environment variable management

### Architecture
```
User Browser
    ↓
Vercel (Docusaurus Static Site)
    ↓ API calls
Railway (FastAPI Backend)
    ↓
Qdrant Cloud (Vector DB)
OpenAI API (LLM & Embeddings)
PostgreSQL (Railway managed)
Redis (Railway add-on)
```

### Environment Configuration
```env
# Backend (.env on Railway)
OPENAI_API_KEY=sk-...
QDRANT_URL=https://....qdrant.io
QDRANT_API_KEY=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CORS_ORIGINS=https://your-docusaurus-site.vercel.app

# Frontend (.env on Vercel)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-docusaurus-site.vercel.app
```

### CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-docusaurus-site.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Alternatives Considered
- **Render**: Similar to Railway, slightly slower cold starts
- **Fly.io**: More control but requires more DevOps knowledge
- **DigitalOcean App Platform**: Good but less FastAPI-specific tooling
- **Monolithic deployment**: Harder to scale independently

---

## Decision 10: Text Selection Detection

### Decision
Use **native browser Selection API** with custom React hook for text selection detection.

### Rationale
- No external dependencies needed
- Works across all modern browsers
- Integrates cleanly with Docusaurus React components
- Can position "Explain This" button relative to selection

### Implementation Pattern
```typescript
// useTextSelection.ts
import { useEffect, useState } from 'react';

export function useTextSelection() {
  const [selection, setSelection] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      const selectedText = sel?.toString().trim() || '';

      if (selectedText.length > 0) {
        setSelection(selectedText);

        // Get selection coordinates
        const range = sel?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 40 // Position button above selection
          });
        }
      } else {
        setSelection('');
        setSelectionPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  return { selection, selectionPosition };
}
```

### UI Pattern
- Floating button appears above selection
- Click button opens chat with pre-populated context
- Button disappears when selection is cleared

### Edge Cases
- Selections spanning multiple elements: Capture full text
- Code block selections: Preserve formatting
- Empty selections: Hide button

### Alternatives Considered
- **Tippy.js or similar**: Adds dependency, overkill for simple tooltip
- **Context menu**: Less discoverable than floating button
- **Selection highlighting**: More complex, not needed for MVP

---

## Summary of All Decisions

| Decision Area | Choice | Key Rationale |
|---------------|--------|---------------|
| OpenAI API Pattern | Chat Completions + SSE | Future-proof, full control, cost-effective |
| Qdrant Config | 1536-dim cosine, 400-512 token chunks | Optimal for semantic search + citations |
| Better-Auth | Root swizzling pattern | No routing conflicts, persistent state |
| Embedding Model | OpenAI text-embedding-3-small | 6-20x cheaper, 75.8% accuracy sufficient |
| Personalization | Single-pass LLM rewriting | Fast, simple, preserves formatting |
| Translation | GPT-4 with specialized prompts | Handles technical content + Urdu well |
| Database | PostgreSQL with JSONB | Structured with flexible arrays |
| Backend Structure | Functional single file | Testable, clear sections, as requested |
| Deployment | Railway + Vercel | Simple, scalable, cost-effective |
| Text Selection | Native Selection API | No deps, works everywhere |

---

## Next Steps

All Phase 0 research is complete. Proceed to **Phase 1: Design Artifacts**:
1. Create `data-model.md` with complete entity schemas
2. Generate `contracts/openapi.yaml` and `contracts/types.ts`
3. Write `quickstart.md` with step-by-step setup
4. Update agent context with new technologies and patterns

**Estimated Phase 1 Duration**: 2-3 hours
**Estimated Implementation Duration**: 2-3 weeks (following tasks in `tasks.md`)
