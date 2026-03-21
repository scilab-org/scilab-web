export type ChatSession = {
  id: string;
  projectId: string;
  title: string;
  type: 'Private chat';
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

// API params & responses

export type GetSessionMessagesParams = {
  limit?: number; // 1-500, default 100
  offset?: number; // >= 0, default 0
};

export type GetSessionMessagesResponse = {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
};

export type GetSessionsResponse = {
  sessions: ChatSession[];
  total: number;
};

export type SendMessageRequest = {
  sessionId?: string; // omit to create a new session
  projectId: string;
  content: string;
};

export type SendMessageResponse = {
  message: ChatMessage;
  sessionId: string;
};

export type DeleteSessionResponse = {
  success: boolean;
};
