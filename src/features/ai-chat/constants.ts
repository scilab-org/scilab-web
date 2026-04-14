const AI_SERVICE_PREFIX = '/ai-service';

export const AI_CHAT_API = {
  SESSIONS: `${AI_SERVICE_PREFIX}/sessions`,
  SESSION_MESSAGES: (sessionId: string) =>
    `${AI_SERVICE_PREFIX}/sessions/${sessionId}/messages`,
  RENAME_SESSION: (sessionId: string) =>
    `${AI_SERVICE_PREFIX}/sessions/${sessionId}`,
  DELETE_SESSION: (sessionId: string) =>
    `${AI_SERVICE_PREFIX}/sessions/${sessionId}`,
  SEND_MESSAGE: `${AI_SERVICE_PREFIX}/chat`,
} as const;

export const AI_CHAT_QUERY_KEYS = {
  SESSIONS: 'chat-sessions',
  SESSION_MESSAGES: 'session-messages',
} as const;

// ─── Chat modes ───────────────────────────────────────────────────────────────

export const CHAT_MODE = {
  CHAT: 'chat',
  WRITE: 'write',
} as const;

export type ChatMode = (typeof CHAT_MODE)[keyof typeof CHAT_MODE];

// ─── Writing action types returned in msgMetadata ─────────────────────────────

export const WRITING_ACTION = {
  PLANNING_QUESTIONS: 'planning_questions',
  SECTION_OUTPUT: 'section_output',
} as const;

export type WritingAction =
  (typeof WRITING_ACTION)[keyof typeof WRITING_ACTION];

// ─── Planning question input types ────────────────────────────────────────────

export const QUESTION_TYPE = {
  TEXT: 'text',
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
} as const;

export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

// ─── Sentinel value for "Other / custom" option in select questions ───────────

export const CUSTOM_OPTION_VALUE = '__custom__' as const;

// ─── Pagination defaults ──────────────────────────────────────────────────────

export const SESSION_MESSAGE_LIMIT = 100;
