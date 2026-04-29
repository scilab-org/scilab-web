import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  PenLine,
  Loader2,
  Bot,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import { useSendMessage } from '@/features/ai-chat/api/send-message';
import { useSessionMessages } from '@/features/ai-chat/api/get-session-messages';
import { useSessions } from '@/features/ai-chat/api/get-sessions';
import { useDeleteSession } from '@/features/ai-chat/api/delete-session';
import { useRenameSession } from '@/features/ai-chat/api/rename-session';
import type {
  ChatMessage,
  PlanningQuestion,
  WritingOutput,
} from '@/features/ai-chat/types';
import {
  CHAT_MODE,
  WRITING_ACTION,
  SESSION_MESSAGE_LIMIT,
  type ChatMode,
} from '@/features/ai-chat/constants';
import { useGetSection } from '@/features/paper-management/api/get-section';
import { useProjectPapers } from '../../api/papers/get-project-papers';
import { PlanningQnABox } from './planning-qna-box';

// ─── Constants ────────────────────────────────────────────────────────────────

const MESSAGE_LIMIT = SESSION_MESSAGE_LIMIT;

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
      <Bot className="text-primary mt-4 h-5 w-5 shrink-0" />
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
  mode,
  onModeChange,
  canWrite = false,
}: {
  onSend: (content: string) => void;
  isSending: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  canWrite?: boolean;
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
      {/* Mode toggle */}
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onModeChange(CHAT_MODE.CHAT)}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
            mode === CHAT_MODE.CHAT
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          )}
        >
          <MessageSquare className="h-3 w-3" />
          Chat
        </button>
        {canWrite && (
          <button
            type="button"
            onClick={() => onModeChange(CHAT_MODE.WRITE)}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
              mode === CHAT_MODE.WRITE
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
            )}
          >
            <PenLine className="h-3 w-3" />
            Write
          </button>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === CHAT_MODE.WRITE
              ? 'Describe what to write...'
              : 'Ask the assistant...'
          }
          rows={1}
          disabled={isSending}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-xs leading-relaxed outline-none focus:ring-1 disabled:opacity-50"
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:text-white"
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
            <Bot className="text-primary mt-4 h-5 w-5 shrink-0" />
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
  sectionId,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onSessionDeleted,
}: {
  projectId: string;
  sectionId?: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onSessionDeleted?: (sessionId: string) => void;
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const sessionsQuery = useSessions({
    params: { projectId, sectionId: sectionId, limit: 10, offset: 0 },
    queryConfig: { enabled: !!projectId },
  });

  const deleteSessionMutation = useDeleteSession({
    projectId,
    mutationConfig: {
      onSuccess: (_data, variables) => {
        setConfirmDeleteId(null);
        setOpenMenuId(null);
        onSessionDeleted?.(variables.sessionId);
      },
    },
  });

  const renameSessionMutation = useRenameSession({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        setRenamingId(null);
        setOpenMenuId(null);
      },
    },
  });

  // Focus rename input when editing starts
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleStartRename = (sessionId: string, currentTitle: string) => {
    setRenamingId(sessionId);
    setRenameValue(currentTitle);
    setOpenMenuId(null);
    setConfirmDeleteId(null);
  };

  const handleConfirmRename = (sessionId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    renameSessionMutation.mutate({ sessionId, title: trimmed });
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleStartDelete = (sessionId: string) => {
    setConfirmDeleteId(sessionId);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = (sessionId: string) => {
    deleteSessionMutation.mutate({ sessionId });
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

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
            <div
              key={session.id}
              className={cn(
                'group relative rounded-md transition-colors',
                activeSessionId === session.id
                  ? 'bg-primary/10'
                  : 'hover:bg-muted',
              )}
            >
              {/* Delete confirmation overlay */}
              {confirmDeleteId === session.id ? (
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-destructive text-xs font-medium">
                    Delete this session?
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(session.id)}
                      disabled={deleteSessionMutation.isPending}
                      className="text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors disabled:opacity-50"
                      title="Confirm delete"
                    >
                      {deleteSessionMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      disabled={deleteSessionMutation.isPending}
                      className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : renamingId === session.id ? (
                /* Inline rename input */
                <div className="flex items-center gap-1 px-2.5 py-1.5">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename(session.id);
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    className="border-input bg-background text-foreground focus:ring-ring min-w-0 flex-1 rounded border px-2 py-0.5 text-xs outline-none focus:ring-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmRename(session.id)}
                    disabled={
                      renameSessionMutation.isPending || !renameValue.trim()
                    }
                    className="text-primary hover:bg-primary/10 rounded p-0.5 transition-colors disabled:opacity-50"
                    title="Save"
                  >
                    {renameSessionMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRename}
                    className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Normal session row */
                <div className="flex items-center">
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      'min-w-0 flex-1 px-2.5 py-2 text-left text-xs',
                      activeSessionId === session.id
                        ? 'text-primary font-medium'
                        : 'text-foreground/70',
                    )}
                    title={session.title}
                  >
                    <span className="block truncate">{session.title}</span>
                    <span className="text-muted-foreground mt-0.5 block text-[10px]">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </span>
                  </button>

                  {/* Actions menu */}
                  <div className="relative shrink-0 pr-1">
                    {openMenuId === session.id ? (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStartRename(session.id, session.title)
                          }
                          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartDelete(session.id)}
                          className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(null)}
                          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                          title="Close"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(session.id);
                        }}
                        className="text-muted-foreground hover:text-foreground rounded p-1 opacity-0 transition-colors group-hover:opacity-100"
                        title="Session options"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main EditorChatPanel ─────────────────────────────────────────────────────

type EditorChatPanelProps = {
  projectId: string;
  sectionId?: string;
  markSectionId?: string;
  sectionTitle?: string;
  sectionContent?: string;
  onWriteOutput?: (output: WritingOutput) => void;
  canWrite?: boolean;
};

export const EditorChatPanel = ({
  projectId,
  sectionId,
  markSectionId,
  sectionTitle,
  sectionContent,
  onWriteOutput,
  canWrite = false,
}: EditorChatPanelProps) => {
  const [chatTab, setChatTab] = useState<'chat' | 'sessions'>('chat');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>(CHAT_MODE.CHAT);
  const [planningQuestions, setPlanningQuestions] = useState<
    PlanningQuestion[] | null
  >(null);
  // When true, suppress auto-select so the user stays on the blank "new chat" screen
  const isNewChatRef = useRef(false);

  const projectPapersQuery = useProjectPapers({
    projectId,
    queryConfig: { enabled: !!projectId },
  });

  const sectionQuery = useGetSection({
    sectionId: sectionId ?? null,
  });
  const ruleset = sectionQuery.data?.result?.rule;
  const sectionContext = sectionQuery.data?.result?.sectionContext;

  // Use markSectionId (stable across versions) for session scoping.
  // Fall back to sectionId if markSectionId is not available.
  const sessionScopeId = markSectionId ?? sectionId;

  // Reset session only when the canonical section (markSectionId) changes,
  // not on every version save that produces a new sectionId.
  const prevSectionIdRef = useRef(sessionScopeId);
  useEffect(() => {
    if (prevSectionIdRef.current !== sessionScopeId) {
      prevSectionIdRef.current = sessionScopeId;
      isNewChatRef.current = false;
      setActiveSessionId(null);
      setPlanningQuestions(null);
      setRefreshKey((k) => k + 1);
    }
  }, [sessionScopeId]);

  // Auto-select the most recent session when sessions load and none is active
  const sessionsQuery = useSessions({
    params: { projectId, sectionId: sessionScopeId, limit: 10, offset: 0 },
    queryConfig: { enabled: !!projectId },
  });

  useEffect(() => {
    if (
      !activeSessionId &&
      !isNewChatRef.current &&
      sessionsQuery.data?.sessions.length
    ) {
      setActiveSessionId(sessionsQuery.data.sessions[0].id);
    }
  }, [sessionsQuery.data, activeSessionId]);

  const sendMessageMutation = useSendMessage({
    mutationConfig: {
      onSuccess: (data) => {
        isNewChatRef.current = false;
        if (!activeSessionId) {
          setActiveSessionId(data.sessionId);
        }
        setPendingMessage(null);
        setRefreshKey((k) => k + 1);

        // Handle write-mode responses directly from mutation result
        const meta = data.assistantMessage.msgMetadata;
        if (meta?.writingAction === WRITING_ACTION.PLANNING_QUESTIONS) {
          setPlanningQuestions(meta.questionSchema as PlanningQuestion[]);
        } else if (meta?.writingAction === WRITING_ACTION.SECTION_OUTPUT) {
          const output = meta.writingOutput as WritingOutput;
          onWriteOutput?.(output);
          setPlanningQuestions(null);
        }
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

      if (mode === CHAT_MODE.WRITE) {
        const projectPaperIds = (
          (projectPapersQuery.data as any)?.result?.items ?? []
        ).map((p: { id: string }) => p.id);
        sendMessageMutation.mutate({
          sessionId: activeSessionId ?? undefined,
          projectId,
          message: content,
          paperIds: projectPaperIds,
          mode: 'write',
          sectionId,
          sectionTarget: sectionTitle,
          writing: {
            currentSection: sectionContent,
            ruleset: ruleset || undefined,
            sectionContext: sectionContext || undefined,
          },
        });
      } else {
        const paperIds = (
          (projectPapersQuery.data as any)?.result?.items ?? []
        ).map((p: { id: string }) => p.id);
        sendMessageMutation.mutate({
          sessionId: activeSessionId ?? undefined,
          projectId,
          message: content,
          paperIds,
          sectionId,
        });
      }
    },
    [
      mode,
      projectId,
      ruleset,
      sectionId,
      sectionTitle,
      sectionContent,
      sectionContext,
      activeSessionId,
      sendMessageMutation,
      projectPapersQuery.data,
    ],
  );

  const handleQnASubmit = useCallback(
    (formattedAnswer: string) => {
      setPlanningQuestions(null);
      handleSend(formattedAnswer);
    },
    [handleSend],
  );

  const handleQnACancel = useCallback(() => {
    setPlanningQuestions(null);
  }, []);

  const handleNewChat = useCallback(() => {
    isNewChatRef.current = true;
    setActiveSessionId(null);
    setPlanningQuestions(null);
    setChatTab('chat');
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    isNewChatRef.current = false;
    setActiveSessionId(sessionId);
    setPlanningQuestions(null);
    setChatTab('chat');
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSessionDeleted = useCallback(
    (sessionId: string) => {
      if (activeSessionId === sessionId) {
        isNewChatRef.current = true;
        setActiveSessionId(null);
        setPlanningQuestions(null);
        setChatTab('chat');
      }
    },
    [activeSessionId],
  );

  const handleModeChange = useCallback((newMode: 'chat' | 'write') => {
    setMode(newMode);
    setPlanningQuestions(null);
  }, []);

  // Reset to chat mode if write access is revoked (e.g. user switches to a read-only section)
  useEffect(() => {
    if (!canWrite && mode === CHAT_MODE.WRITE) {
      setMode(CHAT_MODE.CHAT);
    }
  }, [canWrite, mode]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sub-tab switcher: AI Chat | Sessions */}
      <div className="border-border flex shrink-0">
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
                </p>
              </div>
            </div>
          )}

          {/* Planning Q&A form (replaces input when active) */}
          {planningQuestions ? (
            <PlanningQnABox
              questions={planningQuestions}
              onSubmit={handleQnASubmit}
              onCancel={handleQnACancel}
              isSending={sendMessageMutation.isPending}
            />
          ) : (
            <CompactChatInput
              onSend={handleSend}
              isSending={sendMessageMutation.isPending}
              mode={mode}
              onModeChange={handleModeChange}
              canWrite={canWrite}
            />
          )}
        </div>
      ) : (
        <SessionList
          projectId={projectId}
          sectionId={sessionScopeId}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onSessionDeleted={handleSessionDeleted}
        />
      )}
    </div>
  );
};
