import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

import { useSessions } from '../api/get-sessions';
import { useDeleteSession } from '../api/delete-session';
import type { ChatSession } from '../types';

type ChatSessionSidebarProps = {
  projectId: string;
  projectName: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
};

export const ChatSessionSidebar = ({
  projectId,
  projectName,
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSessionSidebarProps) => {
  const [search, setSearch] = useState('');

  const sessionsQuery = useSessions({ projectId });
  const deleteSessionMutation = useDeleteSession({ projectId });

  const sessions = sessionsQuery.data?.sessions ?? [];
  const filtered = search
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()),
      )
    : sessions;

  const handleDelete = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    deleteSessionMutation.mutate({ sessionId: session.id });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border border-b p-4">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Workspace
        </p>
        <h2 className="text-foreground mt-1 text-lg leading-tight font-bold">
          {projectName}
        </h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {sessionsQuery.data?.total ?? 0} sessions available
        </p>

        <Button
          onClick={onNewChat}
          className="btn-create mt-3 w-full gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Search */}
      <div className="border-border border-b px-4 py-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-ring h-9 w-full rounded-lg border pr-3 pl-10 text-sm outline-none focus:ring-2"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                'group relative flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors',
                isActive
                  ? 'border-l-primary bg-accent'
                  : 'hover:bg-accent/50 border-l-transparent',
              )}
            >
              <span
                className={cn(
                  'line-clamp-2 text-sm leading-snug',
                  isActive ? 'text-primary font-medium' : 'text-foreground',
                )}
              >
                {session.title}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {session.type}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(session.lastMessageAt)}
                </span>
              </div>

              {/* Delete button on hover */}
              <button
                onClick={(e) => handleDelete(e, session)}
                className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground absolute top-2 right-2 hidden rounded-md border p-1 shadow-sm transition-colors group-hover:block"
                title="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          );
        })}

        {filtered.length === 0 && !sessionsQuery.isLoading && (
          <div className="px-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? 'No sessions match your search' : 'No sessions yet'}
            </p>
          </div>
        )}

        {sessionsQuery.isLoading && (
          <div className="space-y-3 px-4 py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
