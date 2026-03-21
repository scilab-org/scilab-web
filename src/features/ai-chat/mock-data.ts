import { nanoid } from 'nanoid';

import type {
  ChatSession,
  ChatMessage,
  GetSessionsResponse,
  GetSessionMessagesParams,
  GetSessionMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  DeleteSessionResponse,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms = 300) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms + Math.random() * 200));

const now = () => new Date().toISOString();

const pastDate = (daysAgo: number, hours = 0, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const sessionsStore = new Map<string, ChatSession[]>();
const messagesStore = new Map<string, ChatMessage[]>();

// ---------------------------------------------------------------------------
// Seed data — created lazily per project
// ---------------------------------------------------------------------------

const SEED_SESSIONS: Omit<ChatSession, 'id' | 'projectId'>[] = [
  {
    title: 'deep research platforms',
    type: 'Private chat',
    createdAt: pastDate(40, 0, 39),
    lastMessageAt: pastDate(40, 0, 39),
    messageCount: 4,
  },
  {
    title:
      "Perform a deep research and tell me how the world's wealthiest govern...",
    type: 'Private chat',
    createdAt: pastDate(41, 19, 35),
    lastMessageAt: pastDate(41, 19, 35),
    messageCount: 6,
  },
  {
    title:
      'What are the investment philosophies of Duan Yongping, Warren Buffett...',
    type: 'Private chat',
    createdAt: pastDate(41, 15, 44),
    lastMessageAt: pastDate(41, 15, 44),
    messageCount: 4,
  },
  {
    title:
      'From 2020 to 2050, how many elderly people will there be in Japan? Wh...',
    type: 'Private chat',
    createdAt: pastDate(41, 4, 50),
    lastMessageAt: pastDate(41, 4, 50),
    messageCount: 8,
  },
  {
    title: 'T20 WC',
    type: 'Private chat',
    createdAt: pastDate(42, 23, 9),
    lastMessageAt: pastDate(42, 23, 9),
    messageCount: 2,
  },
  {
    title: 'openclaw',
    type: 'Private chat',
    createdAt: pastDate(42, 23, 9),
    lastMessageAt: pastDate(42, 23, 9),
    messageCount: 2,
  },
];

const AI_RESPONSE_1 = `# Sovereign Engines: A Global Analysis of Sovereign Wealth Fund Investment Strategies (2025-2026)

---

## 1. The Evolving Framework of Sovereign Wealth Funds

Introduction — state of play and why it matters Sovereign wealth funds (SWFs) have evolved from specialized fiscal buffers into central instruments of twenty-first-century statecraft. Over the past decade the universe of sovereign capital has expanded materially and become more heterogeneous in mandate, risk appetite and operational design. Public estimates put global sovereign AUM at roughly US$11.3 trillion in early 2023, with industry observers reporting continued growth through 2024–2026 (estimates commonly cited in the range of roughly US$12–13.5 trillion). That expansion coincides with three concurrent dynamics that shape the contemporary SWF landscape:

> Geoeconomic fragmentation and friend-shoring pressures, which require funds to factor security, resilience and allied coordination into portfolio choices;

> A rise in mission-oriented, strategic national transformation objectives (energy transition, AI and digital sovereignty, industrial renewal), which push capital toward domestic development missions and`;

const AI_RESPONSE_2 = `## Key Investment Philosophies Compared

### Warren Buffett — Value Investing

Warren Buffett's approach centers on **long-term value creation**:

1. **Circle of competence** — Only invest in businesses you understand deeply
2. **Margin of safety** — Purchase at a significant discount to intrinsic value
3. **Economic moats** — Favor companies with durable competitive advantages
4. **Management quality** — Invest in companies run by honest, capable managers

### Duan Yongping — Concentrated Value

Duan Yongping shares several principles with Buffett but adds:

- **Extreme concentration** — Hold very few positions with high conviction
- **Business fundamentals over market noise** — Focus on the underlying business
- **Long time horizon** — Willingness to hold for decades

---

*Both investors emphasize patience, discipline, and a deep understanding of the businesses they own.*`;

const AI_RESPONSE_3 = `## Japan's Aging Population: 2020–2050 Projections

### Current Situation (2020 Baseline)

As of 2020, Japan's population aged 65 and over stood at approximately **36.2 million**, representing **28.8%** of the total population. This makes Japan the world's most aged society by proportion.

### Projected Growth

| Year | Elderly Population (65+) | Percentage of Total |
|------|--------------------------|---------------------|
| 2020 | 36.2 million | 28.8% |
| 2030 | 37.2 million | 31.2% |
| 2040 | 39.2 million | 35.3% |
| 2050 | 37.7 million | 37.7% |

### Key Implications

1. **Healthcare costs** will increase dramatically
2. **Labor force shrinkage** will accelerate
3. **Pension sustainability** faces serious challenges
4. **Immigration policy** reform becomes increasingly urgent`;

const MOCK_AI_REPLY = `Thank you for your question. Let me provide a comprehensive analysis based on the latest available research.

## Summary

Based on current literature and data, here are the key findings:

1. **Primary finding** — The evidence strongly suggests a positive correlation between the variables studied
2. **Secondary insight** — There are notable regional variations that warrant further investigation
3. **Methodological note** — Most studies in this area use longitudinal designs with sample sizes exceeding 1,000 participants

### Recommendations

- Consider expanding the scope to include additional demographic factors
- Cross-reference with the datasets available in this project
- Further analysis may benefit from a mixed-methods approach

---

*This is a preliminary analysis. Let me know if you'd like me to dive deeper into any specific aspect.*`;

function seedProjectData(projectId: string) {
  if (sessionsStore.has(projectId)) return;

  const sessions: ChatSession[] = [];
  const aiResponses = [
    AI_RESPONSE_1,
    AI_RESPONSE_2,
    AI_RESPONSE_3,
    MOCK_AI_REPLY,
    AI_RESPONSE_1,
    AI_RESPONSE_2,
  ];

  SEED_SESSIONS.forEach((seed, idx) => {
    const sessionId = nanoid();
    const session: ChatSession = {
      ...seed,
      id: sessionId,
      projectId,
    };
    sessions.push(session);

    // Create message pairs for this session
    const messages: ChatMessage[] = [];
    const pairCount = Math.floor(seed.messageCount / 2);

    for (let i = 0; i < pairCount; i++) {
      const msgDate = new Date(seed.createdAt);
      msgDate.setMinutes(msgDate.getMinutes() + i * 5);

      messages.push({
        id: nanoid(),
        sessionId,
        role: 'user',
        content:
          i === 0
            ? seed.title
            : `Follow-up question ${i}: Can you elaborate more on the previous point?`,
        createdAt: msgDate.toISOString(),
      });

      msgDate.setSeconds(msgDate.getSeconds() + 30);
      messages.push({
        id: nanoid(),
        sessionId,
        role: 'assistant',
        content: aiResponses[(idx + i) % aiResponses.length],
        createdAt: msgDate.toISOString(),
      });
    }

    messagesStore.set(sessionId, messages);
  });

  sessionsStore.set(projectId, sessions);
}

// ---------------------------------------------------------------------------
// Mock API functions
// ---------------------------------------------------------------------------

export async function mockGetSessions(
  projectId: string,
): Promise<GetSessionsResponse> {
  await delay();
  seedProjectData(projectId);
  const sessions = sessionsStore.get(projectId) ?? [];
  // Sort by lastMessageAt descending
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
  return { sessions: sorted, total: sorted.length };
}

export async function mockGetSessionMessages(
  sessionId: string,
  params: GetSessionMessagesParams = {},
): Promise<GetSessionMessagesResponse> {
  await delay();
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);
  const allMessages = messagesStore.get(sessionId) ?? [];
  const total = allMessages.length;

  // Messages are stored oldest-first. Pagination works from the end
  // (newest messages first for initial load).
  // offset=0 means the most recent `limit` messages.
  const endIdx = total - offset;
  const startIdx = Math.max(endIdx - limit, 0);
  const messages = allMessages.slice(startIdx, endIdx);

  return {
    messages,
    total,
    hasMore: startIdx > 0,
  };
}

export async function mockDeleteSession(
  sessionId: string,
): Promise<DeleteSessionResponse> {
  await delay();
  // Find which project this session belongs to
  for (const [projectId, sessions] of sessionsStore.entries()) {
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      sessions.splice(idx, 1);
      sessionsStore.set(projectId, sessions);
      break;
    }
  }
  messagesStore.delete(sessionId);
  return { success: true };
}

export async function mockSendMessage(
  request: SendMessageRequest,
): Promise<SendMessageResponse> {
  await delay(200);

  const { projectId, content } = request;
  let { sessionId } = request;

  seedProjectData(projectId);

  // If no sessionId, create a new session
  if (!sessionId) {
    sessionId = nanoid();
    const title =
      content.length > 80 ? content.substring(0, 77) + '...' : content;
    const session: ChatSession = {
      id: sessionId,
      projectId,
      title,
      type: 'Private chat',
      createdAt: now(),
      lastMessageAt: now(),
      messageCount: 0,
    };
    const sessions = sessionsStore.get(projectId) ?? [];
    sessions.unshift(session);
    sessionsStore.set(projectId, sessions);
    messagesStore.set(sessionId, []);
  }

  // Add user message
  const userMessage: ChatMessage = {
    id: nanoid(),
    sessionId,
    role: 'user',
    content,
    createdAt: now(),
  };

  const messages = messagesStore.get(sessionId) ?? [];
  messages.push(userMessage);

  // Simulate AI thinking delay
  await delay(800);

  // Add AI response
  const aiMessage: ChatMessage = {
    id: nanoid(),
    sessionId,
    role: 'assistant',
    content: MOCK_AI_REPLY,
    createdAt: now(),
  };
  messages.push(aiMessage);

  messagesStore.set(sessionId, messages);

  // Update session metadata
  const sessions = sessionsStore.get(projectId) ?? [];
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.lastMessageAt = now();
    session.messageCount = messages.length;
  }

  return { message: aiMessage, sessionId };
}
