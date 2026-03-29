import { useEffect, useRef, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { useSessionMessages } from '../api/get-session-messages';
import { ChatMessageBubble } from './chat-message-bubble';
import type { ChatMessage } from '../types';

type ChatMessageListProps = {
  sessionId: string;
  refreshKey?: number; // increment to force re-fetch after sending
  pendingMessage?: string | null;
};

const MESSAGE_LIMIT = 100;

export const ChatMessageList = ({
  sessionId,
  refreshKey,
  pendingMessage,
}: ChatMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const prevSessionRef = useRef(sessionId);
  const shouldAutoScroll = useRef(true);
  const isLoadingOlder = useRef(false);

  // Reset when session changes
  useEffect(() => {
    if (prevSessionRef.current !== sessionId) {
      setOffset(0);
      setAllMessages([]);
      setHasMore(false);
      shouldAutoScroll.current = true;
      prevSessionRef.current = sessionId;
    }
  }, [sessionId]);

  // Fetch current page of messages
  const messagesQuery = useSessionMessages({
    sessionId,
    params: { limit: MESSAGE_LIMIT, offset },
  });

  // Merge fetched messages into allMessages
  useEffect(() => {
    if (!messagesQuery.data) return;

    const fetched = messagesQuery.data.messages;
    setHasMore(messagesQuery.data.hasMore ?? false);

    setAllMessages((prev) => {
      if (offset === 0) {
        // Initial load or refresh — replace all
        return fetched;
      }
      // Loading older messages — prepend without duplicates
      const existingIds = new Set(prev.map((m) => m.id));
      const newMsgs = fetched.filter((m) => !existingIds.has(m.id));
      return [...newMsgs, ...prev];
    });

    isLoadingOlder.current = false;
  }, [messagesQuery.data, offset]);

  // Auto-scroll to bottom on initial load, refresh, or new messages at offset 0
  useEffect(() => {
    if (
      shouldAutoScroll.current &&
      scrollRef.current &&
      (allMessages.length > 0 || pendingMessage)
    ) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages, refreshKey, pendingMessage]);

  // IntersectionObserver to detect scroll-to-top for loading older messages
  const handleLoadMore = useCallback(() => {
    if (!hasMore || messagesQuery.isFetching || isLoadingOlder.current) return;
    isLoadingOlder.current = true;
    shouldAutoScroll.current = false;

    // Save scroll position to restore after prepend
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;

    setOffset((prev) => prev + MESSAGE_LIMIT);

    // Restore scroll position after DOM update
    requestAnimationFrame(() => {
      if (el) {
        const newHeight = el.scrollHeight;
        el.scrollTop = newHeight - prevHeight;
      }
    });
  }, [hasMore, messagesQuery.isFetching]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // Reset auto-scroll when user scrolls manually
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    shouldAutoScroll.current = isAtBottom;
  };

  if (!sessionId) return null;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
    >
      {/* Top sentinel for infinite scroll */}
      <div ref={topSentinelRef} className="h-1" />

      {/* Loading indicator for older messages */}
      {messagesQuery.isFetching && offset > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      )}

      {/* Messages */}
      <div className="mx-auto max-w-4xl space-y-6">
        {allMessages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {/* Optimistic pending message + typing indicator */}
        {pendingMessage && (
          <>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-primary text-primary-foreground max-w-2xl rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {pendingMessage}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <img
                src="/Logo.svg"
                alt="HyperDataLab Assistant"
                className="mt-5 h-8 w-8 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-primary mb-1 block text-xs font-semibold">
                  HyperDataLab Assistant
                </span>
                <div className="border-border bg-card inline-flex rounded-lg border px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
                    <span className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
                    <span className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Initial loading state */}
      {messagesQuery.isLoading && offset === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-3 text-sm">
            Loading messages...
          </p>
        </div>
      )}
    </div>
  );
};
