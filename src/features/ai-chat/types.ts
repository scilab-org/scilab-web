export type ChatSession = {
  id: string;
  projectId: string;
  title: string;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  msgMetadata: Record<string, unknown>;
  createdAt: string;
};

// --- GET /sessions ---

export type GetSessionsParams = {
  projectId: string;
  limit?: number; // 1–100, default 50
  offset?: number; // >= 0, default 0
};

export type GetSessionsResponse = {
  sessions: ChatSession[];
  total: number;
};

// --- GET /sessions/{sessionId}/messages ---

export type GetSessionMessagesParams = {
  limit?: number; // 1–500, default 100
  offset?: number; // >= 0, default 0
};

export type GetSessionMessagesResponse = {
  messages: ChatMessage[];
  total: number;
  hasMore?: boolean;
};

// --- POST /chat ---

export type SendMessageRequest = {
  message: string; // 1–8000 chars
  projectId?: string; // required when sessionId is null (new session)
  sessionId?: string | null; // null or omit to create a new session
  paperIds?: string[]; // defaults to []
};

export type SendMessageResponse = {
  sessionId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

// --- PATCH /sessions/{sessionId} ---

export type RenameSessionRequest = {
  title: string;
};

export type RenameSessionResponse = {
  id: string;
  title: string;
};

// --- DELETE /sessions/{sessionId} ---
// Returns 204 No Content — no response body
