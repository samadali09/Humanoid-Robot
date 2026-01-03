# Data Model: RAG Chatbot and Personalization Engine

**Feature**: 001-rag-chatbot-personalization
**Date**: 2026-01-03
**Status**: Complete

## Overview

This document defines the complete data model for the RAG Chatbot and Personalization Engine, including entities in PostgreSQL (relational data) and Qdrant (vector embeddings).

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│    User     │1      * │   Session    │1      * │  ChatMessage    │
│             ├─────────┤              ├─────────┤                 │
│ - id        │         │ - id         │         │ - id            │
│ - email     │         │ - user_id    │         │ - session_id    │
│ - password  │         │ - token      │         │ - user_id       │
│ - name      │         │ - expires_at │         │ - role          │
│ - background│         └──────────────┘         │ - content       │
│ - expertise │                                  │ - context       │
└─────────────┘                                  └─────────────────┘
       │
       │1
       │
       │*
┌─────────────────────┐         ┌───────────────────┐
│ PersonalizationCache│         │ TranslationCache  │
│                     │         │                   │
│ - user_id           │         │ - chapter_id      │
│ - chapter_id        │         │ - source_language │
│ - background_level  │         │ - target_language │
│ - personalized_text │         │ - translated_text │
│ - expires_at        │         │ - expires_at      │
└─────────────────────┘         └───────────────────┘

┌──────────────────────────────┐
│  Qdrant: ContentChunk        │
│                              │
│ - id (UUID)                  │
│ - vector (1536 dimensions)   │
│ - payload:                   │
│   - text                     │
│   - file_path                │
│   - chapter                  │
│   - section                  │
│   - chunk_index              │
│   - citation                 │
│   - metadata                 │
└──────────────────────────────┘
```

---

## PostgreSQL Entities

### 1. User Entity

**Purpose**: Stores user account information and profile data for personalization.

**Schema**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    background_level VARCHAR(50) DEFAULT 'beginner' CHECK (background_level IN ('beginner', 'intermediate', 'advanced')),
    expertise_areas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_background ON users(background_level);
```

**Attributes**:
- `id` (UUID): Unique user identifier
- `email` (VARCHAR): User email address, must be unique and valid format
- `password_hash` (VARCHAR): Bcrypt hashed password (never store plaintext)
- `name` (VARCHAR): User's full name
- `background_level` (VARCHAR): One of `beginner`, `intermediate`, `advanced`
- `expertise_areas` (JSONB): Array of expertise strings, e.g. `["AI/ML", "Robotics", "Control Systems"]`
- `created_at` (TIMESTAMP): Account creation timestamp
- `last_login` (TIMESTAMP): Last successful login timestamp

**Validation Rules**:
- Email must match email regex pattern
- Password minimum 8 characters (enforced at application layer)
- Background level must be one of three values
- Expertise areas must be valid JSON array

**Relationships**:
- One-to-many with `sessions`
- One-to-many with `chat_messages`
- One-to-many with `personalization_cache`

**State Transitions**:
```
[New] → [Active] → [Last Login Updated] → [Active]
                         ↓
                    [Inactive] (no login for 30 days)
```

---

### 2. Session Entity

**Purpose**: Manages user authentication sessions.

**Schema**:
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Cleanup expired sessions periodically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Attributes**:
- `id` (UUID): Unique session identifier
- `user_id` (UUID): Foreign key to users table
- `token` (VARCHAR): Unique session token (JWT or random string)
- `expires_at` (TIMESTAMP): Session expiration time (default: 7 days from creation)
- `created_at` (TIMESTAMP): Session creation timestamp

**Validation Rules**:
- Token must be unique across all sessions
- Expires_at must be after created_at
- Sessions automatically deleted when user is deleted (CASCADE)

**Relationships**:
- Many-to-one with `users`
- One-to-many with `chat_messages` (via session_id string reference)

---

### 3. ChatMessage Entity

**Purpose**: Stores conversation messages for history and context.

**Schema**:
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    context_chunks JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT content_not_empty CHECK (LENGTH(content) > 0)
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Partition by month for performance (optional for high volume)
-- CREATE TABLE chat_messages_2026_01 PARTITION OF chat_messages
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Attributes**:
- `id` (UUID): Unique message identifier
- `session_id` (VARCHAR): Session identifier (can be temp for non-authenticated users)
- `user_id` (UUID): Foreign key to users (nullable for anonymous sessions)
- `role` (VARCHAR): Message role - `user`, `assistant`, or `system`
- `content` (TEXT): Message content
- `context_chunks` (JSONB): Array of retrieved RAG context objects
- `created_at` (TIMESTAMP): Message timestamp

**Context Chunks Structure**:
```json
{
  "chunks": [
    {
      "chunk_id": "uuid",
      "text": "Retrieved text snippet...",
      "score": 0.85,
      "citation": "Chapter 2: ROS 2 Basics, Section 2.3"
    }
  ]
}
```

**Validation Rules**:
- Role must be one of three values
- Content cannot be empty string
- Session ID required even for anonymous users

**Relationships**:
- Many-to-one with `users` (SET NULL on user deletion to preserve history)

---

### 4. PersonalizationCache Entity

**Purpose**: Caches personalized content to avoid re-generating.

**Schema**:
```sql
CREATE TABLE personalization_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id VARCHAR(255) NOT NULL,
    background_level VARCHAR(50) NOT NULL,
    personalized_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,

    UNIQUE(user_id, chapter_id, background_level),
    CONSTRAINT valid_ttl CHECK (expires_at > created_at)
);

CREATE INDEX idx_personalization_user_chapter ON personalization_cache(user_id, chapter_id);
CREATE INDEX idx_personalization_expires ON personalization_cache(expires_at);

-- Cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_personalizations()
RETURNS void AS $$
BEGIN
    DELETE FROM personalization_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Attributes**:
- `id` (UUID): Unique cache entry identifier
- `user_id` (UUID): Foreign key to users
- `chapter_id` (VARCHAR): Chapter identifier (e.g., "chapter-2-ros2-basics")
- `background_level` (VARCHAR): User's background level at time of generation
- `personalized_content` (TEXT): Generated personalized markdown content
- `created_at` (TIMESTAMP): Cache entry creation time
- `expires_at` (TIMESTAMP): Cache expiration time (default: 1 hour from creation)

**Validation Rules**:
- Unique constraint on (user_id, chapter_id, background_level) prevents duplicates
- Expires_at must be after created_at
- Entries deleted automatically when user is deleted (CASCADE)

**TTL Strategy**:
- Default TTL: 1 hour (configurable via environment variable)
- Rationale: Balance between cost savings and content freshness
- Invalidation: Delete entry if book content is updated

---

### 5. TranslationCache Entity

**Purpose**: Caches translated content to avoid re-translating.

**Schema**:
```sql
CREATE TABLE translation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id VARCHAR(255) NOT NULL,
    source_language VARCHAR(10) NOT NULL DEFAULT 'en',
    target_language VARCHAR(10) NOT NULL,
    translated_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,

    UNIQUE(chapter_id, source_language, target_language),
    CONSTRAINT valid_ttl CHECK (expires_at > created_at),
    CONSTRAINT valid_languages CHECK (
        source_language IN ('en') AND
        target_language IN ('ur', 'en')
    )
);

CREATE INDEX idx_translation_chapter_lang ON translation_cache(chapter_id, target_language);
CREATE INDEX idx_translation_expires ON translation_cache(expires_at);

-- Cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_translations()
RETURNS void AS $$
BEGIN
    DELETE FROM translation_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**Attributes**:
- `id` (UUID): Unique cache entry identifier
- `chapter_id` (VARCHAR): Chapter identifier
- `source_language` (VARCHAR): Source language code (currently only 'en')
- `target_language` (VARCHAR): Target language code (currently only 'ur' for Urdu)
- `translated_content` (TEXT): Generated translated markdown content
- `created_at` (TIMESTAMP): Cache entry creation time
- `expires_at` (TIMESTAMP): Cache expiration time (default: 24 hours from creation)

**Validation Rules**:
- Unique constraint on (chapter_id, source_language, target_language)
- Expires_at must be after created_at
- Language codes must be from allowed list

**TTL Strategy**:
- Default TTL: 24 hours (longer than personalization)
- Rationale: Translations change less frequently than personalizations
- Invalidation: Delete entry if book content is updated

---

## Qdrant Vector Database Entities

### 6. ContentChunk Entity

**Purpose**: Stores vector embeddings of book content for semantic search.

**Collection Configuration**:
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(url="https://your-qdrant-instance.io", api_key="...")

client.create_collection(
    collection_name="book_content",
    vectors_config=VectorParams(
        size=1536,  # OpenAI text-embedding-3-small
        distance=Distance.COSINE
    ),
    optimizers_config={
        "default_segment_number": 2,
        "indexing_threshold": 10000,
    }
)
```

**Vector Point Structure**:
```python
{
    "id": "uuid-here",  # Unique chunk identifier
    "vector": [0.123, -0.456, ...],  # 1536 dimensions
    "payload": {
        "text": "The actual chunk text content...",
        "file_path": "docs/chapter-2/ros2-basics.md",
        "chapter": "Chapter 2: ROS 2 Basics",
        "section": "2.3 Node Communication",
        "subsection": "2.3.1 Publishers and Subscribers",
        "chunk_id": "chapter-2_chunk-5",
        "chunk_index": 5,
        "total_chunks": 12,
        "chunk_type": "text",  # 'text', 'code_block', 'mixed'
        "content_hash": "md5-hash-of-original-content",
        "citation": "Chapter 2: ROS 2 Basics, Section 2.3.1",
        "h1": "ROS 2 Basics",
        "h2": "Node Communication",
        "h3": "Publishers and Subscribers",
        "code_language": null,  # 'python', 'cpp', 'bash', etc. if code_block
        "frontmatter": {
            "title": "ROS 2 Basics",
            "sidebar_label": "Basics",
            "sidebar_position": 2,
            "keywords": ["ros2", "nodes", "communication"]
        },
        "last_updated": "2026-01-03T10:00:00Z",
        "version": "1.0.0"
    }
}
```

**Attributes**:
- `id` (UUID): Unique chunk identifier
- `vector` (float[]): 1536-dimensional embedding from OpenAI
- `payload.text` (string): The actual text content of the chunk
- `payload.file_path` (string): Relative path to source markdown file
- `payload.chapter` (string): Chapter title (from H1 or frontmatter)
- `payload.section` (string): Section title (from H2)
- `payload.subsection` (string): Subsection title (from H3, if applicable)
- `payload.chunk_id` (string): Human-readable chunk ID
- `payload.chunk_index` (int): Position of chunk in document
- `payload.total_chunks` (int): Total number of chunks in document
- `payload.chunk_type` (string): 'text', 'code_block', or 'mixed'
- `payload.content_hash` (string): MD5 hash for change detection
- `payload.citation` (string): Formatted citation string for display
- `payload.h1/h2/h3` (string): Hierarchical header context
- `payload.code_language` (string): Programming language if code_block
- `payload.frontmatter` (object): Docusaurus frontmatter metadata
- `payload.last_updated` (timestamp): Last modification time
- `payload.version` (string): Content version for tracking changes

**Chunk Types**:
- **text**: Pure prose content without code
- **code_block**: Complete code blocks (preserved intact, not split)
- **mixed**: Text with inline code snippets

**Metadata Usage**:
- **Retrieval**: Used in Qdrant filters (e.g., filter by chapter)
- **Citations**: Displayed to user to show source of information
- **Incremental Updates**: content_hash used to detect changes

**Indexing Strategy**:
- HNSW (Hierarchical Navigable Small World) algorithm for vector search
- Cosine similarity for semantic matching
- Metadata indexed for fast filtering

---

## Data Flow Diagrams

### User Registration Flow
```
[User Submits Form] → [Validate Email/Password]
                            ↓
                    [Hash Password]
                            ↓
                    [Create User Record]
                            ↓
                    [Create Session]
                            ↓
                    [Return JWT Token]
```

### RAG Query Flow
```
[User Query] → [Generate Query Embedding]
                      ↓
              [Search Qdrant for Top-K Chunks]
                      ↓
              [Retrieve Chunk Payloads]
                      ↓
              [Build Context with Citations]
                      ↓
              [OpenAI Chat Completion]
                      ↓
              [Store Message in chat_messages]
                      ↓
              [Return Response with Citations]
```

### Personalization Flow
```
[User Requests Personalization] → [Check personalization_cache]
                                          ↓
                                   [Cache Hit?]
                                  ↙         ↘
                            [Yes]           [No]
                              ↓              ↓
                      [Return Cached]   [Fetch Chapter Content]
                                             ↓
                                     [Get User Profile]
                                             ↓
                                     [OpenAI Rewrite]
                                             ↓
                                     [Cache Result (1h TTL)]
                                             ↓
                                     [Return Personalized Content]
```

### Translation Flow
```
[User Requests Translation] → [Check translation_cache]
                                      ↓
                               [Cache Hit?]
                              ↙         ↘
                        [Yes]           [No]
                          ↓              ↓
                  [Return Cached]   [Fetch Chapter Content]
                                         ↓
                                 [OpenAI Translate]
                                         ↓
                                 [Cache Result (24h TTL)]
                                         ↓
                                 [Return Translated Content]
```

---

## Database Migrations

### Migration Strategy
- Use Alembic for PostgreSQL schema migrations
- Track migration history in `alembic_version` table
- Always test migrations on staging before production

### Initial Migration (001_initial_schema.sql)
```sql
-- Create all tables
-- Create indexes
-- Create functions (cleanup procedures)
-- Create triggers (if needed)

-- Add initial data (optional)
INSERT INTO users (email, password_hash, name, background_level)
VALUES ('admin@example.com', '$2b$12$...', 'Admin User', 'advanced');
```

### Future Migration Example (002_add_user_preferences.sql)
```sql
-- Add new column to users table
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;

-- Create index on new column
CREATE INDEX idx_users_notifications ON users USING gin(notification_preferences);
```

---

## Performance Considerations

### PostgreSQL Optimizations
1. **Indexing**: All foreign keys and frequently queried columns indexed
2. **Partitioning**: Consider partitioning `chat_messages` by month for high volume
3. **Connection Pooling**: Use PgBouncer or SQLAlchemy connection pooling
4. **Vacuum**: Regular VACUUM ANALYZE for query performance

### Qdrant Optimizations
1. **Segment Size**: Configure segment_number based on collection size
2. **Quantization**: Consider scalar quantization to reduce memory usage
3. **Batch Upsert**: Insert vectors in batches of 32-96 for efficiency
4. **Filtering**: Use payload filters to narrow search space before vector search

### Caching Strategy
- **Redis (Hot Data)**: Active sessions, recent conversations (1 hour TTL)
- **PostgreSQL (Warm Data)**: Personalization cache (1 hour TTL), Translation cache (24 hour TTL)
- **Cold Data**: Historical chat messages (permanent storage)

---

## Data Retention Policies

### Users & Sessions
- **Active Users**: Retained indefinitely
- **Inactive Users**: After 1 year of no login, mark as inactive (soft delete)
- **Sessions**: Expired sessions cleaned up daily via cron job

### Chat Messages
- **Authenticated Users**: Retained for 90 days, then archived
- **Anonymous Users**: Retained for 7 days, then deleted
- **Archive**: Move to cold storage (S3/Glacier) for compliance

### Cache Tables
- **Personalization**: Auto-delete after TTL expires (1 hour)
- **Translation**: Auto-delete after TTL expires (24 hours)
- **Cleanup**: Run cleanup functions every hour via cron

### Vector Database
- **Content Chunks**: Retained permanently, updated when book content changes
- **Version History**: Keep last 3 versions of each chunk for rollback

---

## Security Considerations

### Password Security
- Use bcrypt with cost factor 12 for password hashing
- Never store plaintext passwords
- Implement rate limiting on login attempts

### Session Security
- Use secure, random tokens (JWT or random 256-bit strings)
- HttpOnly cookies to prevent XSS
- CSRF protection for state-changing operations
- Rotate session tokens on login/logout

### Data Privacy
- User email addresses are PII - encrypt in database
- Chat messages may contain sensitive information - apply data retention policies
- GDPR compliance: Provide user data export and deletion endpoints

### SQL Injection Prevention
- Use parameterized queries exclusively (no string concatenation)
- Validate all user inputs at application layer
- Apply principle of least privilege for database users

---

## Testing Strategy

### Unit Tests
- Test each entity's validation rules
- Test database constraints (unique, foreign key, check)
- Test TTL expiration logic

### Integration Tests
- Test complete data flows (registration → login → chat → personalization)
- Test cache hit/miss scenarios
- Test RAG retrieval with known queries

### Performance Tests
- Measure query performance on 1000+ chat messages
- Measure vector search latency with 1000+ chunks
- Measure cache hit rates under load

---

## Summary

This data model supports all requirements from the feature specification:
- ✅ User authentication with profile (background level, expertise)
- ✅ RAG-powered chat with conversation history
- ✅ Content personalization with caching
- ✅ Translation with caching
- ✅ Efficient vector search for semantic retrieval
- ✅ Scalable architecture with proper indexing and TTLs

**Total Entities**: 6 (5 PostgreSQL tables + 1 Qdrant collection)
**Estimated Storage**:
- PostgreSQL: ~10-50 MB for 100-500 users with typical usage
- Qdrant: ~10-20 MB for 15-20K word book (500-1000 chunks)

**Next Steps**: Create API contracts that interface with these entities.
