/**
 * TypeScript type definitions for RAG Chatbot and Personalization Engine API
 * Generated from OpenAPI specification
 * Version: 1.0.0
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  backgroundLevel: BackgroundLevel;
  expertiseAreas?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  expiresAt: string; // ISO 8601 date-time
}

export interface UserProfile {
  id: string; // UUID
  email: string;
  name: string;
  backgroundLevel: BackgroundLevel;
  expertiseAreas: string[];
  createdAt: string; // ISO 8601 date-time
  lastLogin: string | null; // ISO 8601 date-time
}

export interface UpdateProfileRequest {
  name?: string;
  backgroundLevel?: BackgroundLevel;
  expertiseAreas?: string[];
}

export type BackgroundLevel = 'beginner' | 'intermediate' | 'advanced';

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ChatRequest {
  message: string;
  sessionId?: string;
  conversationHistory?: ChatMessage[];
  selectedText?: string; // For "Explain This" feature
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string; // ISO 8601 date-time
}

export interface ChatResponse {
  response: string;
  citations: Citation[];
  sessionId: string;
  usage?: Usage;
}

export interface Citation {
  chunkId: string;
  text: string;
  citation: string;
  score: number; // 0-1
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============================================================================
// PERSONALIZATION TYPES
// ============================================================================

export interface PersonalizeRequest {
  chapterId: string;
}

export interface PersonalizeResponse {
  chapterId: string;
  personalizedContent: string; // Markdown
  backgroundLevel: BackgroundLevel;
  cachedAt: string; // ISO 8601 date-time
}

// ============================================================================
// TRANSLATION TYPES
// ============================================================================

export interface TranslateRequest {
  chapterId: string;
  targetLanguage: 'ur'; // Currently only Urdu supported
}

export interface TranslateResponse {
  chapterId: string;
  translatedContent: string; // Markdown
  sourceLanguage: string;
  targetLanguage: string;
  cachedAt: string; // ISO 8601 date-time
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface IngestRequest {
  force_reindex?: boolean;
}

export interface IngestResponse {
  status: 'success' | 'failed';
  chunks_processed: number;
  chunks_added: number;
  chunks_updated: number;
  duration_seconds: number;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    qdrant: 'connected' | 'disconnected';
    openai: 'accessible' | 'inaccessible';
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  error: string;
  detail?: string;
  code?: string;
}

export interface ValidationError {
  error: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// API CLIENT TYPES
// ============================================================================

export interface ApiClientConfig {
  baseURL: string;
  token?: string;
  timeout?: number; // milliseconds
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

// ============================================================================
// HOOKS RETURN TYPES (for React hooks)
// ============================================================================

export interface UseAuthReturn {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: ApiError | null;
  sendMessage: (message: string, selectedText?: string) => Promise<void>;
  clearHistory: () => void;
}

export interface UsePersonalizationReturn {
  personalizedContent: string | null;
  isPersonalizing: boolean;
  error: ApiError | null;
  personalizeChapter: (chapterId: string) => Promise<void>;
  resetToOriginal: () => void;
}

export interface UseTranslationReturn {
  translatedContent: string | null;
  isTranslating: boolean;
  error: ApiError | null;
  translateChapter: (chapterId: string, targetLanguage: 'ur') => Promise<void>;
  resetToOriginal: () => void;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface ChatWidgetProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
  onMessageSent?: (message: ChatMessage) => void;
}

export interface ExplainButtonProps {
  selectedText: string;
  position: { x: number; y: number };
  onExplain: (text: string) => void;
}

export interface PersonalizeButtonProps {
  chapterId: string;
  onPersonalize?: (content: string) => void;
  disabled?: boolean;
}

export interface TranslateButtonProps {
  chapterId: string;
  targetLanguage: 'ur';
  onTranslate?: (content: string) => void;
  disabled?: boolean;
}

export interface UserProfileProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateProfile?: (data: UpdateProfileRequest) => void;
}

// ============================================================================
// VECTOR DB TYPES (for internal use)
// ============================================================================

export interface ContentChunk {
  id: string; // UUID
  text: string;
  file_path: string;
  chapter: string;
  section: string;
  subsection?: string;
  chunk_id: string;
  chunk_index: number;
  total_chunks: number;
  chunk_type: 'text' | 'code_block' | 'mixed';
  content_hash: string;
  citation: string;
  h1: string;
  h2?: string;
  h3?: string;
  code_language?: string;
  frontmatter?: Record<string, any>;
  last_updated: string; // ISO 8601 date-time
  version: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: ContentChunk;
}

// ============================================================================
// DATABASE TYPES (for backend use)
// ============================================================================

export interface UserRecord {
  id: string; // UUID
  email: string;
  password_hash: string;
  name: string;
  background_level: BackgroundLevel;
  expertise_areas: string[]; // JSONB in DB
  created_at: Date;
  last_login: Date | null;
}

export interface SessionRecord {
  id: string; // UUID
  user_id: string; // UUID
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface ChatMessageRecord {
  id: string; // UUID
  session_id: string;
  user_id: string | null; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_chunks: any; // JSONB in DB
  created_at: Date;
}

export interface PersonalizationCacheRecord {
  id: string; // UUID
  user_id: string; // UUID
  chapter_id: string;
  background_level: BackgroundLevel;
  personalized_content: string;
  created_at: Date;
  expires_at: Date;
}

export interface TranslationCacheRecord {
  id: string; // UUID
  chapter_id: string;
  source_language: string;
  target_language: string;
  translated_content: string;
  created_at: Date;
  expires_at: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Awaited<T> = T extends Promise<infer U> ? U : T;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Type guard functions
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'error' in error;
}

export function isValidationError(error: any): error is ValidationError {
  return (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    'details' in error &&
    Array.isArray(error.details)
  );
}

export function isBackgroundLevel(value: any): value is BackgroundLevel {
  return ['beginner', 'intermediate', 'advanced'].includes(value);
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BACKGROUND_LEVELS: readonly BackgroundLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

export const EXPERTISE_AREAS = [
  'AI/ML',
  'Robotics',
  'Control Systems',
  'Computer Vision',
  'Mechanical Design',
  'ROS 2',
  'Gazebo',
  'NVIDIA Isaac',
  'Networking',
  'Data Science',
] as const;

export const SUPPORTED_LANGUAGES = ['ur'] as const;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  CHAT: {
    SEND: '/chat',
    STREAM: '/chat/stream',
  },
  PERSONALIZATION: {
    PERSONALIZE: '/personalize',
  },
  TRANSLATION: {
    TRANSLATE: '/translate',
  },
  ADMIN: {
    INGEST: '/ingest',
    HEALTH: '/health',
  },
} as const;

export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Chat errors
  CHAT_INVALID_REQUEST: 'CHAT_INVALID_REQUEST',
  CHAT_NO_CONTEXT: 'CHAT_NO_CONTEXT',
  CHAT_GENERATION_FAILED: 'CHAT_GENERATION_FAILED',

  // Personalization errors
  PERSONALIZE_CHAPTER_NOT_FOUND: 'PERSONALIZE_CHAPTER_NOT_FOUND',
  PERSONALIZE_GENERATION_FAILED: 'PERSONALIZE_GENERATION_FAILED',

  // Translation errors
  TRANSLATE_UNSUPPORTED_LANGUAGE: 'TRANSLATE_UNSUPPORTED_LANGUAGE',
  TRANSLATE_GENERATION_FAILED: 'TRANSLATE_GENERATION_FAILED',

  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// ============================================================================
// HELPER TYPES FOR FORM VALIDATION
// ============================================================================

export interface SignupFormData extends SignupRequest {
  confirmPassword: string;
}

export interface LoginFormData extends LoginRequest {}

export interface UpdateProfileFormData extends UpdateProfileRequest {}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export type { BackgroundLevel as UserBackgroundLevel };
export type { ChatMessage as Message };
export type { ApiError as ErrorResponse };
