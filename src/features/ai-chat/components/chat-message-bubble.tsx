import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/utils/cn';
import type { ChatMessage } from '../types';

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

export const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="bg-primary text-primary-foreground max-w-2xl rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <span className="text-primary-foreground text-xs font-semibold">
            You
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <span className="text-primary-foreground text-xs font-bold">AI</span>
      </div>
      <div
        className={cn(
          'border-border bg-card max-w-3xl rounded-lg border px-5 py-4',
          'prose prose-sm dark:prose-invert max-w-none',
          // Markdown styling overrides
          'prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2 prose-headings:first:mt-0',
          'prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-2',
          'prose-strong:text-foreground',
          'prose-blockquote:border-l-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:not-italic',
          'prose-li:text-foreground/90',
          'prose-hr:border-border prose-hr:my-4',
          'prose-table:text-sm',
          'prose-th:text-foreground prose-th:font-semibold',
          'prose-td:text-foreground/90',
        )}
      >
        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
      </div>
    </div>
  );
};
