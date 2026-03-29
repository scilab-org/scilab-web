import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { cn } from '@/utils/cn';
import type { ChatMessage } from '../types';

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

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

export const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-primary text-primary-foreground max-w-2xl rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-muted-foreground text-[11px]">
          {formatTime(message.createdAt)}
        </span>
      </div>
    );
  }

  return (
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
        <div
          className={cn(
            'border-border bg-card max-w-3xl rounded-lg border px-5 py-4',
            'prose prose-sm dark:prose-invert max-w-none',
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
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {normalizeLatex(message.content)}
          </Markdown>
        </div>
        <span className="text-muted-foreground mt-1 block text-[11px]">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};
