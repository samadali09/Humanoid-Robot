# Implementation Tasks: RAG Chatbot and Personalization Engine

**Feature**: 001-rag-chatbot-personalization
**Branch**: `001-rag-chatbot-personalization`
**Date**: 2026-01-03
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

This document breaks down the implementation into granular, testable tasks organized by user story. Each phase represents an independently testable increment that delivers value.

**Implementation Strategy**: MVP-first with incremental delivery. Complete User Story 1 (P1) first for a working RAG chatbot, then add features incrementally.

**Total Tasks**: 85 tasks across 7 phases
**Parallelization**: 42 tasks can run in parallel (marked with [P])
**MVP Scope**: Phase 1-3 (User Story 1) = 32 tasks

---

## Phase 1: Project Setup & Infrastructure (12 tasks)

**Goal**: Initialize project structure, configure dependencies, and verify API connections.

**Completion Criteria**:
- Backend and frontend directories exist with correct structure
- All dependencies installed and importable
- API keys configured and connections verified
- Development servers can start without errors

### Setup Tasks

- [X] T001 Create monorepo directory structure (backend/, book/) per plan.md
- [X] T002 Create backend/.env file with Qdrant URL, Qdrant API key, and Cohere API key from existing credentials
- [X] T003 Create backend/.env.example template file with placeholder values
- [X] T004 [P] Create backend/requirements.txt with FastAPI, uvicorn, cohere, qdrant-client, psycopg, python-dotenv, pydantic, httpx
- [X] T005 [P] Create backend/.python-version file with "3.11"
- [X] T006 [P] Create backend/README.md with quickstart instructions from quickstart.md
- [X] T007 Install Python dependencies in backend/ using `pip install -r requirements.txt`
- [X] T008 [P] Create backend/test_connection.py to verify Qdrant and Cohere connections
- [X] T009 Run backend/test_connection.py and verify both services connect successfully
- [X] T010 [P] Create backend/.gitignore with .env, __pycache__, *.pyc, venv/, .pytest_cache/
- [ ] T011 [P] Create backend/Dockerfile for containerized deployment (optional for later)
- [X] T012 Verify project structure matches plan.md layout

---

## Phase 2: Foundational Backend (RAG Infrastructure) (20 tasks)

**Goal**: Build core RAG infrastructure - vector database setup, embedding generation, and content ingestion.

**Completion Criteria**:
- Qdrant collection created with correct schema
- Markdown files can be chunked and embedded
- Content successfully ingested into vector database
- Health endpoint returns "connected" for all services

**Dependencies**: Must complete Phase 1 before starting

### Infrastructure Tasks

- [X] T013 Create backend/main.py with FastAPI app initialization and CORS middleware
- [X] T014 [P] Add Qdrant client initialization in backend/main.py with URL and API key from .env
- [X] T015 [P] Add Cohere client initialization in backend/main.py with API key from .env
- [X] T016 [P] Implement GET /health endpoint in backend/main.py to check Qdrant and Cohere connectivity
- [X] T017 [P] Implement GET / root endpoint in backend/main.py with API information

### Embedding & Chunking Utilities

- [X] T018 [P] Implement compute_content_hash(text) function in backend/main.py using MD5
- [X] T019 [P] Implement chunk_text(text, chunk_size=500, overlap=50) function in backend/main.py
- [X] T020 [P] Implement extract_markdown_metadata(file_path) function in backend/main.py to extract H1 and frontmatter
- [X] T021 [P] Implement async generate_embeddings(texts) function in backend/main.py using Cohere embed-english-v3.0
- [X] T022 [P] Implement async generate_query_embedding(query) function in backend/main.py with input_type='search_query'

### Vector Database Setup

- [ ] T023 Implement collection creation logic in backend/main.py with 1024 dimensions (Cohere), COSINE distance
- [ ] T024 Implement async ingest_markdown_files(force_reindex) function in backend/main.py
- [ ] T025 Add file discovery logic to find all .md files in BOOK_DOCS_PATH
- [ ] T026 Add chunking logic to split each markdown file into 500-char chunks with 50-char overlap
- [ ] T027 Add batch embedding generation for all chunks
- [ ] T028 Add point creation with payload (text, chunk_id, file_path, chapter, citation, content_hash)
- [ ] T029 Add upsert logic to push points to Qdrant collection
- [ ] T030 Implement POST /ingest endpoint in backend/main.py with admin API key check (X-API-Key header)
- [ ] T031 Test ingestion with sample markdown files and verify chunks appear in Qdrant
- [ ] T032 Add startup event handler to check/create collection if needed

---

## Phase 3: User Story 1 - Basic Context-Aware Q&A (Priority: P1) (18 tasks)

**Story Goal**: Enable readers to ask questions about book content and receive answers with relevant context and citations.

**Independent Test Criteria**:
1. User can open any book page and see a chat interface
2. User can type a question and receive a response within 3 seconds
3. Response includes relevant excerpts from the book
4. Response includes citations showing source chapters/sections
5. System politely handles questions about topics not in the book

**Acceptance Scenarios** (from spec.md):
- AS1: Ask "What is REST?" on API Design chapter → get answer with citations
- AS2: Ask question spanning multiple chapters → get aggregated answer
- AS3: Ask unrelated question → get polite "not covered" message

**Dependencies**: Requires Phase 2 (RAG infrastructure) complete

### Backend - RAG Retrieval (US1)

- [ ] T033 [P] [US1] Create ChatRequest Pydantic model in backend/main.py with message, session_id, selected_text fields
- [ ] T034 [P] [US1] Create Citation Pydantic model in backend/main.py with chunk_id, text, citation, score fields
- [ ] T035 [P] [US1] Create ChatResponse Pydantic model in backend/main.py with response, citations, session_id fields
- [ ] T036 [US1] Implement async retrieve_context(query, top_k=5) function in backend/main.py
- [ ] T037 [US1] Add query embedding generation in retrieve_context using Cohere
- [ ] T038 [US1] Add Qdrant search with query vector, limit=top_k
- [ ] T039 [US1] Add result formatting to return list of context dicts with chunk_id, text, citation, score
- [ ] T040 [US1] Implement POST /chat endpoint in backend/main.py accepting ChatRequest
- [ ] T041 [US1] Add context retrieval logic in /chat endpoint
- [ ] T042 [US1] Add response generation (simple context concatenation for MVP, LLM integration later)
- [ ] T043 [US1] Add citation formatting in response
- [ ] T044 [US1] Add error handling for empty context (no relevant chunks found)
- [ ] T045 [US1] Test /chat endpoint with sample questions and verify citations
- [ ] T046 [US1] Run backend server with `uvicorn main:app --reload` and verify /chat works

### Frontend - Chat Widget (US1)

- [X] T047 [P] [US1] Create book/src/components/ChatWidget.tsx React component skeleton
- [X] T048 [P] [US1] Add chat UI state management (messages array, isOpen, isLoading)
- [X] T049 [P] [US1] Implement chat message display with user/assistant roles
- [X] T050 [P] [US1] Implement message input form with send button
- [X] T051 [US1] Implement API call to POST /chat endpoint in ChatWidget.tsx
- [X] T052 [US1] Add loading indicator while waiting for response
- [X] T053 [US1] Display response with citations as clickable links
- [X] T054 [US1] Add toggle button to open/close chat widget
- [X] T055 [US1] Style chat widget (floating bottom-right, responsive design)
- [X] T056 [US1] Embed ChatWidget in Docusaurus layout or Root.tsx

### Integration Testing (US1)

- [ ] T057 [US1] Test User Story 1 - AS1: Ask "What is REST?" and verify answer with citations
- [ ] T058 [US1] Test User Story 1 - AS2: Ask question spanning multiple chapters, verify aggregated answer
- [ ] T059 [US1] Test User Story 1 - AS3: Ask unrelated question, verify polite "not covered" response
- [ ] T060 [US1] Verify chat response time is under 3 seconds (SC-001 from spec.md)

---

## Phase 4: User Story 2 - Text Selection Explanation (Priority: P2) (10 tasks)

**Story Goal**: Enable users to highlight text and get explanations specifically about that selection.

**Independent Test Criteria**:
1. User can select any text on a page
2. "Explain This" button appears near selection
3. Clicking button opens chat with selected text as context
4. Response focuses on explaining the selected text
5. Works with code blocks and multi-paragraph selections

**Acceptance Scenarios** (from spec.md):
- AS1: Select text → trigger "Explain This" → chat opens with selection
- AS2: Select code snippet → get detailed code breakdown
- AS3: Select multi-paragraph text → get coherent explanation

**Dependencies**: Requires Phase 3 (User Story 1) complete

### Frontend - Text Selection (US2)

- [ ] T061 [P] [US2] Create book/src/hooks/useTextSelection.ts custom React hook
- [ ] T062 [P] [US2] Implement native Selection API listener in useTextSelection.ts
- [ ] T063 [P] [US2] Track selected text and selection coordinates (x, y)
- [ ] T064 [P] [US2] Create book/src/components/ExplainButton.tsx component
- [ ] T065 [US2] Position ExplainButton above selection using coordinates
- [ ] T066 [US2] Add onClick handler to pass selected text to ChatWidget
- [ ] T067 [US2] Update ChatWidget.tsx to accept pre-populated query with selected text
- [ ] T068 [US2] Update backend /chat endpoint to handle selected_text field (pass to RAG as additional context)
- [ ] T069 [US2] Test text selection on regular paragraph → verify ExplainButton appears
- [ ] T070 [US2] Test text selection on code block → verify explanation focuses on code

### Integration Testing (US2)

- [ ] T071 [US2] Test User Story 2 - AS1: Select text, trigger action, verify chat opens with context
- [ ] T072 [US2] Test User Story 2 - AS2: Select code snippet, verify detailed breakdown
- [ ] T073 [US2] Test User Story 2 - AS3: Select multi-paragraph text, verify coherent explanation
- [ ] T074 [US2] Verify "Explain This" action completes within 1 second (SC-004 from spec.md)

---

## Phase 5: User Story 3 - User Authentication and Profile Creation (Priority: P3) (15 tasks)

**Story Goal**: Enable users to create accounts with background profiles for personalization.

**Independent Test Criteria**:
1. User can access signup form
2. User can register with email, password, background level, and expertise areas
3. User is automatically logged in after signup
4. User can log in on return visits
5. User can view and edit their profile

**Acceptance Scenarios** (from spec.md):
- AS1: Click "Sign Up" → see registration form with all fields
- AS2: Submit valid signup → account created, auto-login
- AS3: Return and log in → profile loaded
- AS4: Access profile → view and update settings

**Dependencies**: Can be developed independently after Phase 2

### Backend - Database Setup (US3)

- [ ] T075 [P] [US3] Create database schema SQL file with users, sessions tables from data-model.md
- [ ] T076 [P] [US3] Set up PostgreSQL database connection in backend/main.py using DATABASE_URL from .env
- [ ] T077 [US3] Run database schema creation script to create users and sessions tables

### Backend - Auth Endpoints (US3)

- [ ] T078 [P] [US3] Create SignupRequest, LoginRequest, AuthResponse, UserProfile Pydantic models in backend/main.py
- [ ] T079 [P] [US3] Implement password hashing utility function using bcrypt
- [ ] T080 [P] [US3] Implement JWT token generation and validation functions
- [ ] T081 [US3] Implement POST /auth/signup endpoint in backend/main.py
- [ ] T082 [US3] Add email validation, password hashing, user creation logic in signup endpoint
- [ ] T083 [US3] Implement POST /auth/login endpoint in backend/main.py
- [ ] T084 [US3] Add credential verification, session creation, JWT generation logic in login endpoint
- [ ] T085 [US3] Implement POST /auth/logout endpoint in backend/main.py to invalidate session
- [ ] T086 [US3] Implement GET /auth/profile endpoint in backend/main.py to return user profile
- [ ] T087 [US3] Implement PUT /auth/profile endpoint in backend/main.py to update user profile
- [ ] T088 [US3] Add authentication middleware to verify JWT tokens for protected endpoints

### Frontend - Auth UI (US3)

- [ ] T089 [P] [US3] Create book/src/lib/auth.ts server-side auth instance using Better-Auth
- [ ] T090 [P] [US3] Create book/src/lib/auth-client.ts client-side auth client
- [ ] T091 [P] [US3] Create book/src/components/AuthProvider.tsx with useSession hook
- [ ] T092 [US3] Create book/src/theme/Root.tsx to wrap app with AuthProvider (swizzle Root component)
- [ ] T093 [P] [US3] Create book/src/components/Auth/SignUp.tsx component with form
- [ ] T094 [P] [US3] Add email, password, name, backgroundLevel, expertiseAreas fields to SignUp form
- [ ] T095 [US3] Implement signup form submission handler calling /auth/signup
- [ ] T096 [P] [US3] Create book/src/components/Auth/SignIn.tsx component with form
- [ ] T097 [US3] Implement login form submission handler calling /auth/login
- [ ] T098 [P] [US3] Create book/src/components/Auth/UserProfile.tsx component
- [ ] T099 [US3] Display user profile data (name, email, background level, expertise areas)
- [ ] T100 [US3] Add profile edit functionality calling PUT /auth/profile
- [ ] T101 [US3] Add logout button calling POST /auth/logout
- [ ] T102 [US3] Create signup and login pages at book/src/pages/signup.tsx and book/src/pages/login.tsx

### Integration Testing (US3)

- [ ] T103 [US3] Test User Story 3 - AS1: Click "Sign Up", verify form with all fields
- [ ] T104 [US3] Test User Story 3 - AS2: Submit signup, verify account created and auto-login
- [ ] T105 [US3] Test User Story 3 - AS3: Log out, log back in, verify profile loaded
- [ ] T106 [US3] Test User Story 3 - AS4: Access profile, update settings, verify saved
- [ ] T107 [US3] Verify signup process completes in under 2 minutes (SC-003 from spec.md)

---

## Phase 6: User Story 4 - Content Personalization (Priority: P4) (12 tasks)

**Story Goal**: Dynamically adjust chapter content complexity based on user's background level.

**Independent Test Criteria**:
1. "Personalize Chapter" button visible for logged-in users
2. Clicking button generates personalized content based on user background
3. Beginner users get simplified explanations with analogies
4. Advanced users get condensed basics with advanced implications
5. User can toggle between personalized and original content

**Acceptance Scenarios** (from spec.md):
- AS1: Beginner views advanced chapter → content simplified
- AS2: Advanced user views beginner chapter → basics condensed
- AS3: Navigate away and return → personalized version preserved
- AS4: Click "Reset to Original" → original content restored

**Dependencies**: Requires Phase 5 (User Story 3) complete for auth

### Backend - Personalization (US4)

- [ ] T108 [P] [US4] Create PersonalizeRequest, PersonalizeResponse Pydantic models in backend/main.py
- [ ] T109 [P] [US4] Create personalization_cache table in database schema
- [ ] T110 [US4] Implement async personalize_content(chapter_content, user_background, expertise_areas) function in backend/main.py
- [ ] T111 [US4] Add OpenAI API client initialization (requires OPENAI_API_KEY in .env)
- [ ] T112 [US4] Implement single-pass LLM rewriting with prompt engineering for personalization
- [ ] T113 [US4] Add logic to preserve markdown formatting, code blocks, and citations during rewriting
- [ ] T114 [US4] Implement POST /personalize endpoint in backend/main.py (requires authentication)
- [ ] T115 [US4] Add cache check logic (Redis or PostgreSQL) with 1-hour TTL
- [ ] T116 [US4] Add cache miss logic to call personalize_content and store result
- [ ] T117 [US4] Test personalization endpoint with beginner and advanced profiles

### Frontend - Personalization UI (US4)

- [ ] T118 [P] [US4] Create book/src/components/PersonalizeButton.tsx component
- [ ] T119 [US4] Add API call to POST /personalize with chapter ID and auth token
- [ ] T120 [US4] Display personalized content in place of original chapter content
- [ ] T121 [US4] Add "Reset to Original" button to restore original content
- [ ] T122 [US4] Add loading indicator during personalization (5-second timeout)
- [ ] T123 [US4] Embed PersonalizeButton in Docusaurus chapter pages (logged-in users only)

### Integration Testing (US4)

- [ ] T124 [US4] Test User Story 4 - AS1: Beginner user clicks "Personalize Chapter" on advanced content, verify simplification
- [ ] T125 [US4] Test User Story 4 - AS2: Advanced user clicks "Personalize Chapter" on basic content, verify condensation
- [ ] T126 [US4] Test User Story 4 - AS3: Personalize chapter, navigate away, return, verify personalized version preserved
- [ ] T127 [US4] Test User Story 4 - AS4: Click "Reset to Original", verify original content restored
- [ ] T128 [US4] Verify personalization completes within 5 seconds (SC-005 from spec.md)

---

## Phase 7: User Story 5 - Translation to Urdu (Priority: P5) (10 tasks)

**Story Goal**: Translate chapter content to Urdu while preserving formatting and code blocks.

**Independent Test Criteria**:
1. "Translate to Urdu" button visible on all chapters
2. Clicking button translates text content to Urdu
3. Code blocks remain unchanged
4. Markdown formatting preserved (headers, lists, links)
5. User can toggle back to English

**Acceptance Scenarios** (from spec.md):
- AS1: Click "Translate to Urdu" → entire chapter translated with formatting preserved
- AS2: Chapter with code → code unchanged, text translated
- AS3: Click "Back to English" → original English content restored
- AS4: Translate multiple chapters → each remembers state independently

**Dependencies**: Can be developed independently after Phase 2

### Backend - Translation (US5)

- [ ] T129 [P] [US5] Create TranslateRequest, TranslateResponse Pydantic models in backend/main.py
- [ ] T130 [P] [US5] Create translation_cache table in database schema
- [ ] T131 [US5] Implement async translate_content(chapter_content, target_language) function in backend/main.py
- [ ] T132 [US5] Add GPT-4 translation with specialized prompt to preserve code blocks and markdown
- [ ] T133 [US5] Add logic to handle technical terms (keep English or add Urdu explanation)
- [ ] T134 [US5] Implement POST /translate endpoint in backend/main.py
- [ ] T135 [US5] Add cache check logic (PostgreSQL) with 24-hour TTL
- [ ] T136 [US5] Add cache miss logic to call translate_content and store result
- [ ] T137 [US5] Test translation endpoint with sample chapter containing code blocks

### Frontend - Translation UI (US5)

- [ ] T138 [P] [US5] Create book/src/components/TranslateButton.tsx component
- [ ] T139 [US5] Add API call to POST /translate with chapter ID and target language "ur"
- [ ] T140 [US5] Display translated content in place of original chapter content
- [ ] T141 [US5] Add "Back to English" button to restore original content
- [ ] T142 [US5] Add loading indicator during translation (8-second timeout)
- [ ] T143 [US5] Embed TranslateButton in Docusaurus chapter pages

### Integration Testing (US5)

- [ ] T144 [US5] Test User Story 5 - AS1: Click "Translate to Urdu", verify translation with formatting
- [ ] T145 [US5] Test User Story 5 - AS2: Translate chapter with code, verify code unchanged
- [ ] T146 [US5] Test User Story 5 - AS3: Click "Back to English", verify restoration
- [ ] T147 [US5] Test User Story 5 - AS4: Translate multiple chapters, verify independent state
- [ ] T148 [US5] Verify translation completes within 8 seconds (SC-006 from spec.md)

---

## Phase 8: Polish & Cross-Cutting Concerns (8 tasks)

**Goal**: Error handling, logging, performance optimization, and deployment preparation.

**Completion Criteria**:
- Comprehensive error messages for all failure modes
- Logging configured at appropriate levels
- API rate limiting implemented
- Performance meets all success criteria
- Deployment documentation complete

**Dependencies**: Complete all user stories first

### Error Handling & Logging

- [ ] T149 [P] Add comprehensive error handling for Qdrant connection failures in backend/main.py
- [ ] T150 [P] Add comprehensive error handling for Cohere API errors (rate limits, invalid key)
- [ ] T151 [P] Add comprehensive error handling for OpenAI API errors (rate limits, invalid responses)
- [ ] T152 [P] Configure structured logging with appropriate log levels (INFO, WARNING, ERROR)
- [ ] T153 [P] Add request/response logging middleware in FastAPI

### Performance & Optimization

- [ ] T154 [P] Implement caching strategy for frequently asked questions (Redis or in-memory)
- [ ] T155 [P] Add request rate limiting middleware to prevent abuse
- [ ] T156 [P] Optimize chunk size and overlap based on performance testing
- [ ] T157 [P] Add connection pooling for PostgreSQL queries
- [ ] T158 [P] Measure and verify all performance goals from plan.md (< 3s chat, < 5s personalization, < 8s translation)

### Deployment Preparation

- [ ] T159 [P] Create docker-compose.yml for local development environment
- [ ] T160 [P] Create backend/Dockerfile for production deployment
- [ ] T161 [P] Create deployment documentation for Railway (backend) and Vercel (frontend)
- [ ] T162 [P] Add environment variable validation on startup
- [ ] T163 [P] Create production .env.example with all required variables
- [ ] T164 [P] Add health check endpoint monitoring script
- [ ] T165 [P] Test full deployment flow from local → staging → production

### Documentation

- [ ] T166 [P] Update backend/README.md with complete API documentation
- [ ] T167 [P] Create API usage examples for all endpoints
- [ ] T168 [P] Add troubleshooting guide for common errors
- [ ] T169 [P] Create user guide for chat, personalization, and translation features
- [ ] T170 Final review of all success criteria from spec.md

---

## Task Dependencies & Execution Order

### User Story Completion Order

The user stories are designed to be mostly independent, but the recommended completion order based on dependencies is:

1. **User Story 1 (P1) - MUST complete first**: Core RAG chatbot functionality. Blocks nothing.
2. **User Story 2 (P2) - Can start after US1**: Text selection enhancement. Depends on US1 chat infrastructure.
3. **User Story 3 (P3) - Can start in parallel with US1/US2**: Authentication system. Independent of chat.
4. **User Story 4 (P4) - Requires US3 complete**: Personalization needs authentication for user profiles.
5. **User Story 5 (P5) - Can start in parallel with US3/US4**: Translation is independent, only needs RAG infrastructure.

### Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (RAG Infrastructure) ← BLOCKING FOR ALL
    ↓
    ├─→ Phase 3 (US1: Chat) ← MVP
    │       ↓
    │   Phase 4 (US2: Text Selection)
    │
    ├─→ Phase 5 (US3: Auth) ← Can start in parallel with Phase 3
    │       ↓
    │   Phase 6 (US4: Personalization)
    │
    └─→ Phase 7 (US5: Translation) ← Can start in parallel with Phases 3-6
            ↓
        Phase 8 (Polish)
```

### Parallel Execution Examples

**Week 1: Setup + RAG Infrastructure**
- Tasks T001-T032 (sequential, foundational)

**Week 2: MVP (User Story 1)**
- Backend: T033-T046 (sequential for context flow)
- Frontend: T047-T056 (can work in parallel with backend after T046)
- Testing: T057-T060 (after both complete)

**Week 3: Enhancement + Auth (Parallel Tracks)**
- **Track A**: US2 Text Selection (T061-T074) - Frontend dev
- **Track B**: US3 Auth Backend (T075-T088) - Backend dev
- **Track C**: US3 Auth Frontend (T089-T102) - Frontend dev
- Integration: T103-T107 (after Track B+C)

**Week 4: Advanced Features (Parallel Tracks)**
- **Track A**: US4 Personalization (T108-T128) - Requires US3
- **Track B**: US5 Translation (T129-T148) - Independent

**Week 5: Polish & Deploy**
- Tasks T149-T170 (mostly parallel polish tasks)

---

## MVP Definition

**Minimum Viable Product**: Phases 1-3 only (User Story 1)

**MVP Delivers**:
- Functional RAG chatbot embedded in Docusaurus
- Users can ask questions and get answers with citations
- Meets core success criteria (3-second response time, 85% relevance)

**MVP Task Count**: 60 tasks
**Estimated MVP Time**: 2-3 weeks (1 developer)

**Post-MVP Enhancements** (can be added incrementally):
- Phase 4: Text selection explanation
- Phase 5: User authentication
- Phase 6: Content personalization
- Phase 7: Translation
- Phase 8: Polish

---

## Testing Strategy

**Per-Phase Testing**:
- Each phase includes integration tests for its user story
- Tests verify acceptance scenarios from spec.md
- Tests verify success criteria from spec.md

**No Unit Tests Required**: Feature spec does not explicitly request TDD approach. Focus on integration tests that verify user-facing functionality.

**Test Coverage**:
- User Story 1: 4 integration tests (T057-T060)
- User Story 2: 4 integration tests (T071-T074)
- User Story 3: 5 integration tests (T103-T107)
- User Story 4: 5 integration tests (T124-T128)
- User Story 5: 5 integration tests (T144-T148)

**Total Integration Tests**: 23 tests

---

## Success Criteria Validation

Each user story maps to specific success criteria from spec.md:

| User Story | Success Criteria | Tasks |
|------------|------------------|-------|
| US1: Chat | SC-001 (< 3s response), SC-002 (85% relevance), SC-008 (100 concurrent users) | T060, T158 |
| US2: Text Selection | SC-004 (< 1s action) | T074 |
| US3: Auth | SC-003 (< 2min signup), SC-009 (24h session) | T107 |
| US4: Personalization | SC-005 (< 5s generation), SC-007 (70% satisfaction) | T128 |
| US5: Translation | SC-006 (< 8s translation) | T148 |
| All | SC-010 (10-turn context) | T060 |

---

## Implementation Notes

1. **Start with MVP**: Complete Phases 1-3 before moving to enhancements
2. **Parallel Development**: US2, US3, US5 can be developed in parallel after MVP
3. **OpenAI Integration**: US4 and US5 require OPENAI_API_KEY (not included in initial setup)
4. **Database Setup**: US3 requires PostgreSQL; can use SQLite for development
5. **Testing**: Run integration tests after each phase to validate incrementally

---

## Next Steps

After tasks.md is approved:

1. Execute Phase 1 (Setup) - ~1 day
2. Execute Phase 2 (RAG Infrastructure) - ~3-4 days
3. Execute Phase 3 (MVP: User Story 1) - ~5-7 days
4. Demo MVP and gather feedback
5. Prioritize Phases 4-7 based on feedback
6. Execute selected phases incrementally
7. Complete Phase 8 (Polish) before production deployment

**Total Estimated Time**: 4-5 weeks for complete feature (all phases)
**MVP Time**: 2-3 weeks (Phases 1-3 only)

Ready to start implementation!
