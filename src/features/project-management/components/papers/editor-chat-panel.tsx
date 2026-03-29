import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import { useSendMessage } from '@/features/ai-chat/api/send-message';
import { useSessionMessages } from '@/features/ai-chat/api/get-session-messages';
import { useSessions } from '@/features/ai-chat/api/get-sessions';
import type { ChatMessage } from '@/features/ai-chat/types';
import { useProjectPapers } from '../../api/papers/get-project-papers';

// ─── Compact chat message bubble for the editor side panel ────────────────────

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Normalise LaTeX delimiters so remark-math can parse them.
 * - \[...\]  →  $$...$$   (display / block math)
 * - \(...\)  →  $...$     (inline math)
 */
const normalizeLatex = (text: string): string =>
  text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, body) => `$$${body}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, body) => `$${body}$`);

const CompactMessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2">
          <p className="text-xs leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-muted-foreground text-left text-[10px]">
          {formatTime(message.createdAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <img
        src="/Logo.svg"
        alt="HyperDataLab Assistant"
        className="mt-4 h-5 w-5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <span className="text-primary text-[10px] font-semibold">
          HyperDataLab Assistant
        </span>
        <div
          className={cn(
            'border-border bg-card mt-1 rounded-lg border px-3 py-2',
            'prose prose-xs dark:prose-invert max-w-none',
            'prose-headings:text-foreground prose-headings:mt-2 prose-headings:mb-1 prose-headings:text-sm prose-headings:first:mt-0',
            'prose-p:text-foreground/90 prose-p:text-xs prose-p:leading-relaxed prose-p:my-1',
            'prose-strong:text-foreground',
            'prose-blockquote:border-l-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-blockquote:text-xs',
            'prose-li:text-foreground/90 prose-li:text-xs',
            'prose-code:text-xs',
          )}
        >
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {normalizeLatex(message.content)}
          </Markdown>
        </div>
        <span className="text-muted-foreground mt-0.5 block text-[10px]">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

// ─── Compact chat input for the editor side panel ─────────────────────────────

const CompactChatInput = ({
  onSend,
  isSending,
}: {
  onSend: (content: string) => void;
  isSending: boolean;
}) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-border shrink-0 border-t px-3 py-2.5">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the assistant..."
          rows={1}
          disabled={isSending}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-xs leading-relaxed outline-none focus:ring-1 disabled:opacity-50"
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          size="icon"
          className="bg-primary hover:bg-primary/90 h-8 w-8 shrink-0 rounded-lg"
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <p className="text-muted-foreground mt-1 text-[10px]">
        Enter to send. Shift+Enter for a new line.
      </p>
    </div>
  );
};

// ─── Message list with auto-scroll ────────────────────────────────────────────

const MESSAGE_LIMIT = 100;

const CompactMessageList = ({
  sessionId,
  refreshKey,
  pendingMessage,
}: {
  sessionId: string;
  refreshKey: number;
  pendingMessage?: string | null;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  const messagesQuery = useSessionMessages({
    sessionId,
    params: { limit: MESSAGE_LIMIT, offset: 0 },
  });

  useEffect(() => {
    if (!messagesQuery.data) return;
    const sorted = [...messagesQuery.data.messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    setAllMessages(sorted);
  }, [messagesQuery.data]);

  // Auto-scroll to bottom on new messages or pending
  useEffect(() => {
    if (scrollRef.current && (allMessages.length > 0 || pendingMessage)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages, refreshKey, pendingMessage]);

  if (messagesQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        <p className="text-muted-foreground text-xs">Loading messages...</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3"
    >
      {allMessages.map((message) => (
        <CompactMessageBubble key={message.id} message={message} />
      ))}

      {/* Optimistic pending message + typing indicator */}
      {pendingMessage && (
        <>
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2">
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {pendingMessage}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <img
              src="/Logo.svg"
              alt="HyperDataLab Assistant"
              className="mt-4 h-5 w-5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-primary mb-1 block text-[10px] font-semibold">
                HyperDataLab Assistant
              </span>
              <div className="border-border bg-card inline-flex rounded-lg border px-3 py-2">
                <div className="flex items-center gap-1">
                  <span className="bg-muted-foreground/60 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                  <span className="bg-muted-foreground/60 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
                  <span className="bg-muted-foreground/60 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Session list for the "Sessions" sub-tab ──────────────────────────────────

const SessionList = ({
  projectId,
  activeSessionId,
  onSelectSession,
  onNewChat,
}: {
  projectId: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}) => {
  const sessionsQuery = useSessions({
    params: { projectId, limit: 10, offset: 0 },
    queryConfig: { enabled: !!projectId },
  });

  const sessions = sessionsQuery.data?.sessions ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <Button
          onClick={onNewChat}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          + New chat
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {sessionsQuery.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            No sessions yet. Start a new chat.
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                'w-full truncate rounded-md px-2.5 py-2 text-left text-xs transition-colors',
                activeSessionId === session.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground/70 hover:bg-muted',
              )}
              title={session.title}
            >
              <span className="block truncate">{session.title}</span>
              <span className="text-muted-foreground mt-0.5 block text-[10px]">
                {new Date(session.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main EditorChatPanel ─────────────────────────────────────────────────────

type EditorChatPanelProps = {
  projectId: string;
  sectionTitle?: string;
};

export const EditorChatPanel = ({
  projectId,
  sectionTitle,
}: EditorChatPanelProps) => {
  const [chatTab, setChatTab] = useState<'chat' | 'sessions'>('chat');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const projectPapersQuery = useProjectPapers({
    projectId,
    queryConfig: { enabled: !!projectId },
  });

  const sendMessageMutation = useSendMessage({
    mutationConfig: {
      onSuccess: (data) => {
        if (!activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
        setPendingMessage(null);
        setRefreshKey((k) => k + 1);
      },
      onError: () => {
        setPendingMessage(null);
      },
    },
  });

  const handleSend = useCallback(
    (content: string) => {
      if (!projectId) return;
      setPendingMessage(content);
      const paperIds = (
        (projectPapersQuery.data as any)?.result?.items ?? []
      ).map((p: { id: string }) => p.id);
      sendMessageMutation.mutate({
        sessionId: activeSessionId ?? undefined,
        projectId,
        message: content,
        paperIds,
      });
    },
    [projectId, activeSessionId, sendMessageMutation, projectPapersQuery.data],
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setChatTab('chat');
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setChatTab('chat');
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sub-tab switcher: AI Chat | Sessions */}
      <div className="border-border flex shrink-0 border-b">
        <button
          type="button"
          onClick={() => setChatTab('chat')}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            chatTab === 'chat'
              ? 'border-primary text-primary border-b-2'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          AI Chat
        </button>
        <button
          type="button"
          onClick={() => setChatTab('sessions')}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
            chatTab === 'sessions'
              ? 'border-primary text-primary border-b-2'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Sessions
        </button>
      </div>

      {/* Content area */}
      {chatTab === 'chat' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeSessionId ? (
            <CompactMessageList
              sessionId={activeSessionId}
              refreshKey={refreshKey}
              pendingMessage={pendingMessage}
            />
          ) : pendingMessage ? (
            <CompactMessageList
              sessionId=""
              refreshKey={refreshKey}
              pendingMessage={pendingMessage}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <MessageSquare className="text-primary h-6 w-6" />
              </div>
              <div className="text-center">
                <h3 className="text-foreground text-sm font-semibold">
                  HyperDataLab Assistant
                </h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Ask questions about{' '}
                  {sectionTitle ? (
                    <span className="font-medium">{sectionTitle}</span>
                  ) : (
                    'your paper'
                  )}
                  . Your first message will create a new session.
                </p>
              </div>
            </div>
          )}
          <CompactChatInput
            onSend={handleSend}
            isSending={sendMessageMutation.isPending}
          />
        </div>
      ) : (
        <SessionList
          projectId={projectId}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
      )}
    </div>
  );
};
