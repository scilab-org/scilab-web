const AI_SERVICE_PREFIX = '/ai-service';

export const AI_CHAT_API = {
  SESSIONS: `${AI_SERVICE_PREFIX}/chat`,
  SESSION_MESSAGES: (sessionId: string) =>
    `${AI_SERVICE_PREFIX}/sessions/${sessionId}/messages`,
  DELETE_SESSION: (sessionId: string) =>
    `${AI_SERVICE_PREFIX}/sessions/${sessionId}`,
  SEND_MESSAGE: `${AI_SERVICE_PREFIX}/chat`,
} as const;

export const AI_CHAT_QUERY_KEYS = {
  SESSIONS: 'chat-sessions',
  SESSION_MESSAGES: 'session-messages',
} as const;
