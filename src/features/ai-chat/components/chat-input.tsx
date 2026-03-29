import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ChatInputProps = {
  onSend: (content: string) => void;
  isSending: boolean;
  isSessionActive: boolean;
};

export const ChatInput = ({
  onSend,
  isSending,
  isSessionActive,
}: ChatInputProps) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
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
    <div className="border-border bg-background border-t px-4 py-3 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Input row */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              rows={1}
              disabled={isSending}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className="btn-create shrink-0 gap-2"
            size="default"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>

        {/* Hints */}
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Enter to send. Shift+Enter for a new line.
          </p>
          <p className="text-muted-foreground text-xs">
            {isSessionActive ? 'Session active' : 'New session'}
          </p>
        </div>
      </div>
    </div>
  );
};
