# Implementation Plan: Integrated RAG Chatbot and Personalization Engine for Docusaurus Book

**Branch**: `001-rag-chatbot-personalization` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rag-chatbot-personalization/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The feature implements a comprehensive RAG-powered chatbot system embedded in a Docusaurus-based technical book. The system provides context-aware Q&A from book content, text selection explanations, user authentication with background profiles, dynamic content personalization based on expertise level, and Urdu translation. The technical approach uses a FastAPI backend with Qdrant Cloud for vector search, Cohere for embeddings, and integrates with OpenAI API for LLM capabilities. The frontend uses React components embedded in Docusaurus with Better-Auth for authentication.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript/React 18+ (frontend), Node.js 18+ (Docusaurus)
**Primary Dependencies**:
- Backend: FastAPI, uvicorn, cohere, qdrant-client, psycopg[binary], python-dotenv, pydantic, httpx
- Frontend: Docusaurus 3.x, React 18, Better-Auth, TypeScript, TailwindCSS (optional)
**Storage**:
- Vector Database: Qdrant Cloud (free tier)
- Relational Database: PostgreSQL (for user profiles, sessions, cache)
- Session Store: In-memory or Redis (optional for production)
**Testing**:
- Backend: pytest, pytest-asyncio, httpx (for API testing)
- Frontend: Jest, React Testing Library, Cypress (E2E)
**Target Platform**:
- Backend: Linux/macOS server (containerized with Docker)
- Frontend: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Deployment: Static site (GitHub Pages, Vercel, Netlify) + Backend API (Railway, Render, Fly.io)
**Project Type**: Web application (monorepo with separate backend/ and book/ directories)
**Performance Goals**:
- Chat response time: < 3 seconds (95th percentile)
- Personalization generation: < 5 seconds
- Translation generation: < 8 seconds
- RAG retrieval latency: < 500ms
- Support 100 concurrent users
**Constraints**:
- Qdrant Cloud free tier: 1GB storage limit
- API rate limits: Cohere (10k requests/month free), OpenAI (token limits based on tier)
- Cold start time for serverless backend: < 10 seconds acceptable
- Client-side bundle size: < 500KB (excluding Docusaurus core)
**Scale/Scope**:
- Expected book size: 15,000-20,000 words (~50-60 pages)
- Estimated vector database size: ~500-1000 document chunks
- Expected user base: 100-500 active users
- Session duration: 24 hours
- Cache TTL: Personalization (1 hour), Translation (24 hours)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ PASS: Technical accuracy
- **Requirement**: All content must be technically accurate concerning ROS 2, Gazebo, Unity, NVIDIA Isaac, RAG, and related Physical AI topics
- **Compliance**: The RAG system will retrieve content directly from the book, preserving all technical accuracy from source material. System prompts will emphasize accuracy and citation of sources.

### ✅ PASS: Clarity for CS/engineering audience
- **Requirement**: Book content and explanations must be clear for CS/engineering audience
- **Compliance**: The chatbot will maintain the technical rigor of the book while providing explanations. Personalization feature can adjust complexity for different backgrounds without compromising accuracy.

### ✅ PASS: Reproducibility
- **Requirement**: All code, pipelines, and experimental setups must be fully reproducible
- **Compliance**: Implementation will use `uv` for Python dependency management with lock files. Docker containers for reproducible deployment. All configuration via `.env` files with `.env.example` templates.

### ✅ PASS: Rigor
- **Requirement**: Information must be rigorously supported using official documentation and peer-reviewed sources
- **Compliance**: RAG system retrieves directly from curated book content which meets this standard. Chat responses will include citations to source sections.

### ✅ PASS: Source-verified claims (APA style)
- **Requirement**: All claims must be cited using APA style
- **Compliance**: Book content follows APA citations. Chatbot responses will reference book sections which contain proper citations.

### ✅ PASS: Minimum 40-50% peer-reviewed/official documentation
- **Requirement**: 40-50% of sources must be peer-reviewed or official docs
- **Compliance**: Book content meets this requirement. RAG system operates on this curated content.

### ✅ PASS: Zero plagiarism
- **Requirement**: All content must be original
- **Compliance**: Chatbot generates responses using LLM with RAG context, properly attributed to source sections. No direct copying without citation.

### ✅ PASS: Flesch-Kincaid grade 10-12
- **Requirement**: Readability must target grade 10-12
- **Compliance**: Book content is written to this standard. Chatbot will maintain similar readability, with personalization adjusting complexity appropriately.

### ✅ PASS: Book structure follows course modules
- **Requirement**: Structured into ROS 2, Gazebo & Unity, NVIDIA Isaac, VLA, and Capstone modules
- **Compliance**: RAG ingestion will preserve chapter/module structure as metadata for better retrieval and citations.

### ✅ PASS: Book word count (15,000-20,000 words)
- **Requirement**: Total word count constraint
- **Compliance**: RAG system operates on existing content. Feature does not modify word count.

### ✅ PASS: Minimum credible sources (20+)
- **Requirement**: Minimum 20 credible sources
- **Compliance**: Book content includes required sources. Chatbot preserves and references these sources.

### ✅ PASS: Book format (Docusaurus + GitHub Pages)
- **Requirement**: Docusaurus with GitHub Pages publishing
- **Compliance**: Implementation integrates directly into existing Docusaurus site. Chat widget embedded via React components.

### ✅ PASS: RAG chatbot backend (FastAPI)
- **Requirement**: Must use FastAPI backend
- **Compliance**: Backend implemented with FastAPI as specified in user requirements.

### ⚠️ CLARIFICATION NEEDED: RAG chatbot agent (OpenAI Agents/ChatKit)
- **Requirement**: Must integrate with OpenAI Agents/ChatKit
- **Current Approach**: User specified Cohere for embeddings but OpenAI for LLM. Will use OpenAI API for chat completions (compatible with Agents API).
- **Resolution**: Use OpenAI Chat Completions API which supports both standard completions and Assistants/Agents API. Phase 0 research will determine optimal approach.

### ✅ PASS: RAG chatbot vector database (Qdrant Cloud Free Tier)
- **Requirement**: Must use Qdrant Cloud
- **Compliance**: Implementation uses qdrant-client with Qdrant Cloud connection.

### ✅ PASS: RAG chatbot content restriction (book content only)
- **Requirement**: Answer questions exclusively from book content
- **Compliance**: RAG retrieval limited to ingested book content. System prompts will instruct LLM to only use provided context and politely decline off-topic questions.

### ✅ PASS: RAG chatbot text selection
- **Requirement**: Must support text-selection mode
- **Compliance**: Frontend implements text selection detection with "Explain This" button that passes selected text as context to chat endpoint.

### ✅ PASS: Code reproducibility
- **Requirement**: All code must run without modification
- **Compliance**: Using `uv` for deterministic Python deps, `package-lock.json` for Node.js, `.env.example` for configuration, and Docker for containerization.

### ✅ PASS: All claims verified
- **Requirement**: All claims must be verifiable against cited sources
- **Compliance**: RAG system retrieves from verified book content. Responses include citations to source sections.

### Summary
**Status**: ✅ **ALL GATES PASSED** (1 clarification to be resolved in Phase 0)
- No violations requiring justification
- All constitutional requirements satisfied by design
- One technical clarification needed regarding OpenAI Agents API usage pattern

## Project Structure

### Documentation (this feature)

```text
specs/001-rag-chatbot-personalization/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   ├── openapi.yaml     # Backend API specification
│   └── types.ts         # Frontend TypeScript types
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Monorepo structure with two root directories
backend/                 # FastAPI backend (Python)
├── pyproject.toml      # uv project configuration
├── .python-version     # Python version (3.11)
├── main.py             # Single "God File" with all server logic
├── .env.example        # Environment variables template
├── Dockerfile          # Container definition
└── tests/
    ├── test_ingestion.py
    ├── test_rag.py
    ├── test_auth.py
    ├── test_personalization.py
    └── test_translation.py

book/                    # Docusaurus site (Node.js/React)
├── package.json
├── package-lock.json
├── docusaurus.config.js
├── docs/               # Markdown content (to be ingested by RAG)
├── src/
│   ├── components/
│   │   ├── ChatWidget.tsx       # Main chat component
│   │   ├── ExplainButton.tsx    # Text selection handler
│   │   ├── PersonalizeButton.tsx
│   │   └── TranslateButton.tsx
│   ├── hooks/
│   │   ├── useAuth.ts           # Better-Auth integration
│   │   ├── useChat.ts           # Chat API client
│   │   └── useTextSelection.ts  # Text selection detection
│   ├── services/
│   │   ├── api.ts               # Backend API client
│   │   └── auth.ts              # Auth service
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── theme/
│       └── Root.tsx             # Global wrapper for auth state
└── tests/
    ├── unit/
    └── e2e/

.github/
└── workflows/
    ├── backend-ci.yml
    └── frontend-ci.yml

docker-compose.yml       # Local development environment
README.md               # Project setup instructions
```

**Structure Decision**: Selected **Web application (monorepo)** structure with separate `backend/` and `book/` directories. This matches the user's specified architecture with:
- `backend/` containing the FastAPI "God File" (`main.py`) with all server logic
- `book/` containing the existing Docusaurus site with embedded React components
- Monorepo approach allows coordinated changes and shared type definitions
- Clear separation of concerns: backend handles RAG/AI, frontend handles UI/UX

## Complexity Tracking

**Status**: No violations requiring justification.

All constitutional requirements are satisfied by design. The architecture is intentionally simple:
- Single backend file (`main.py`) consolidates all server logic as requested
- Direct integration with existing Docusaurus site
- Minimal external dependencies (FastAPI, Qdrant, Cohere, OpenAI)
- Standard authentication pattern with Better-Auth
- No custom abstractions or frameworks beyond what's necessary

## Phase 0: Research & Unknowns

The following technical areas require research to resolve ambiguities and establish best practices:

### Research Task 1: OpenAI Agents API Integration Pattern
**Unknown**: Optimal pattern for integrating OpenAI Agents/ChatKit with FastAPI backend
**Questions**:
- Should we use OpenAI Assistants API (with threads/runs) or standard Chat Completions API?
- How to handle streaming responses for real-time chat experience?
- Best practices for managing conversation context (in-memory vs. database vs. OpenAI threads)?
**Deliverable**: Decision on OpenAI API pattern with code examples

### Research Task 2: Qdrant Cloud Connection & Configuration
**Unknown**: Qdrant Cloud setup, authentication, and optimal collection configuration
**Questions**:
- How to configure Qdrant collection (vector size, distance metric, indexing)?
- Best practices for chunking Docusaurus markdown (preserve code blocks, handle frontmatter)?
- Optimal metadata structure for citations (chapter, section, file path, line numbers)?
**Deliverable**: Qdrant collection schema and ingestion strategy

### Research Task 3: Better-Auth Integration with Docusaurus
**Unknown**: Best approach for integrating Better-Auth into Docusaurus without conflicts
**Questions**:
- How to initialize Better-Auth in Docusaurus theme system?
- Should auth state be managed in React Context or external state library?
- How to handle auth redirects without disrupting Docusaurus routing?
**Deliverable**: Better-Auth initialization pattern and authentication flow

### Research Task 4: Text Selection Detection in Docusaurus
**Unknown**: Reliable cross-browser text selection detection in Docusaurus MDX content
**Questions**:
- How to detect text selection in Docusaurus rendered markdown (including code blocks)?
- Where to position "Explain This" button (tooltip, floating button, context menu)?
- How to handle selection across multiple elements or inside code blocks?
**Deliverable**: Text selection implementation strategy with UX mockup

### Research Task 5: Cohere vs. OpenAI Embeddings
**Unknown**: Trade-offs between Cohere and OpenAI embedding models
**Questions**:
- Which embedding model provides better retrieval quality for technical content?
- Cost comparison (Cohere free tier vs. OpenAI embedding pricing)?
- Compatibility with Qdrant (both support standard vector dimensions)?
**Deliverable**: Embedding model selection with rationale

### Research Task 6: Content Personalization Strategy
**Unknown**: Approach for generating personalized content based on user background
**Questions**:
- Should personalization use prompt engineering (single LLM call) or multi-step processing?
- How to preserve markdown structure, code blocks, and citations during rewriting?
- Caching strategy for personalized content (per-user per-chapter)?
**Deliverable**: Personalization algorithm and prompt templates

### Research Task 7: Translation Implementation
**Unknown**: Best approach for technical content translation to Urdu
**Questions**:
- Should we use OpenAI translation or dedicated translation API?
- How to handle technical terms (preserve English or translate)?
- How to preserve markdown formatting and code blocks during translation?
**Deliverable**: Translation implementation approach with sample outputs

### Research Task 8: PostgreSQL Schema for User Profiles and Sessions
**Unknown**: Optimal database schema for users, sessions, and cache
**Questions**:
- How to structure user profiles table (background level, expertise areas as JSONB or normalized)?
- Should sessions be stored in database or in-memory (Redis)?
- Cache table design for personalization and translation (TTL, invalidation)?
**Deliverable**: Database schema with migrations

### Research Task 9: FastAPI Single-File Architecture Patterns
**Unknown**: Best practices for organizing FastAPI "God File" with 1000+ lines
**Questions**:
- How to structure endpoints, models, dependencies, and utilities in single file?
- Should we use classes or pure functions for organization?
- How to make the file testable despite its size?
**Deliverable**: Code organization pattern for `main.py`

### Research Task 10: Deployment Strategy
**Unknown**: Optimal deployment setup for FastAPI backend and Docusaurus frontend
**Questions**:
- Should backend be serverless (Railway, Render) or containerized (Fly.io, DigitalOcean)?
- How to handle environment variables and secrets (Qdrant API key, OpenAI API key)?
- CORS configuration for frontend-backend communication?
**Deliverable**: Deployment architecture and configuration

**Next Steps**: Execute research tasks in parallel where possible. Consolidate findings in `research.md` with decisions, rationale, and alternatives considered.

## Phase 1: Design Artifacts

**Prerequisites**: `research.md` complete

### Artifact 1: Data Model (`data-model.md`)
Extract entities from feature specification and design complete data model including:
- User entity (email, password hash, background level, expertise areas, timestamps)
- ContentChunk entity (Qdrant collection schema with metadata)
- ChatSession entity (session ID, user ID, message history)
- ChatMessage entity (role, content, context chunks, timestamp)
- PersonalizationCache entity (user ID, chapter ID, personalized content, TTL)
- TranslationCache entity (chapter ID, language, translated content, TTL)
- Database schema (PostgreSQL) vs. Vector DB schema (Qdrant)
- State transitions (user registration → login → personalization)

### Artifact 2: API Contracts (`contracts/`)
Generate OpenAPI specification for backend endpoints:
- `POST /ingest` - Trigger book content ingestion (admin endpoint)
- `POST /chat` - RAG-powered Q&A endpoint
- `POST /personalize` - Content personalization endpoint
- `POST /translate` - Content translation endpoint
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `GET /health` - Health check endpoint

TypeScript types for frontend:
- Request/response types for all endpoints
- User profile types
- Chat message types
- Error response types

### Artifact 3: Quickstart Guide (`quickstart.md`)
Step-by-step setup instructions:
1. Prerequisites (Python 3.11+, Node.js 18+, Qdrant Cloud account, OpenAI API key)
2. Backend setup (`uv init`, install dependencies, configure `.env`)
3. Database setup (PostgreSQL, run migrations)
4. Run ingestion (populate Qdrant with book content)
5. Frontend setup (npm install, configure API endpoint)
6. Run development servers (backend: `uvicorn main:app`, frontend: `npm start`)
7. Test the integration (open chat, ask question, verify response)
8. Run tests (backend: `pytest`, frontend: `npm test`)

### Artifact 4: Agent Context Update
Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude` to update agent-specific context file with:
- New technologies: FastAPI, Cohere, Qdrant, Better-Auth, Docusaurus
- Architecture decisions from `research.md`
- File paths and structure from this plan
- Key patterns and conventions

**Output**: `data-model.md`, `/contracts/*`, `quickstart.md`, updated agent context file

## Re-evaluation After Phase 1

**Action**: After completing Phase 1 design artifacts, re-run Constitution Check to verify:
- Data model preserves technical accuracy and rigor
- API contracts support all required features without violating constraints
- Quickstart ensures reproducibility
- No new violations introduced by design decisions

**Expected Result**: All gates continue to pass. If any violations detected, document in Complexity Tracking table with justification or revise design.

## Next Command

After this plan is complete, proceed with:
```
/sp.tasks
```

This will break down the implementation into granular, testable tasks based on the design artifacts created in Phase 1.
