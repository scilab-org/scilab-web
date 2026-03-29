import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Check, X, Pencil } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useSessions } from '../api/get-sessions';
import { useDeleteSession } from '../api/delete-session';
import { useRenameSession } from '../api/rename-session';
import type { ChatSession, GetSessionsParams } from '../types';

type ChatSessionSidebarProps = {
  projectId: string;
  projectName: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
};

const SIDEBAR_SESSION_LIMIT = 10;

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
  const [sessionsParams, setSessionsParams] = useState<GetSessionsParams>({
    projectId,
    limit: SIDEBAR_SESSION_LIMIT,
    offset: 0,
  });

  // Inline rename state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const sessionsQuery = useSessions({ params: sessionsParams });
  const deleteSessionMutation = useDeleteSession({ projectId });
  const renameSessionMutation = useRenameSession({ projectId });

  const sessions = sessionsQuery.data?.sessions ?? [];
  const total = sessionsQuery.data?.total ?? 0;
  const hasMoreSessions = sessions.length < total;

  const filtered = search
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()),
      )
    : sessions;

  const handleShowMore = useCallback(() => {
    setSessionsParams((prev) => ({
      ...prev,
      limit: (prev.limit ?? SIDEBAR_SESSION_LIMIT) + SIDEBAR_SESSION_LIMIT,
    }));
  }, []);

  const handleDelete = (sessionId: string) => {
    deleteSessionMutation.mutate({ sessionId });
  };

  // Inline rename handlers
  const startRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const confirmRename = () => {
    if (!editingSessionId) return;
    const trimmed = editTitle.trim();
    if (
      trimmed &&
      trimmed !== sessions.find((s) => s.id === editingSessionId)?.title
    ) {
      renameSessionMutation.mutate({
        sessionId: editingSessionId,
        title: trimmed,
      });
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const cancelRename = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

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
          {total} session{total !== 1 ? 's' : ''} available
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
          const isEditing = session.id === editingSessionId;

          return (
            <button
              key={session.id}
              onClick={() => !isEditing && onSelectSession(session.id)}
              className={cn(
                'group relative flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors',
                isActive
                  ? 'border-l-primary bg-accent'
                  : 'hover:bg-accent/50 border-l-transparent',
              )}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={confirmRename}
                    className="border-input bg-background text-foreground focus:ring-ring min-w-0 flex-1 rounded border px-2 py-0.5 text-sm outline-none focus:ring-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmRename();
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                    title="Save"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelRename();
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <span
                  className={cn(
                    'line-clamp-2 text-sm leading-snug',
                    isActive ? 'text-primary font-medium' : 'text-foreground',
                  )}
                >
                  {session.title}
                </span>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {formatDate(session.updatedAt)}
                </span>
              </div>

              {/* Action buttons on hover (hidden when editing) */}
              {!isEditing && (
                <div className="absolute top-2 right-2 hidden items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={(e) => startRename(e, session)}
                    className="bg-background border-border hover:bg-muted rounded-md border p-1 shadow-sm transition-colors"
                    title="Rename session"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground rounded-md border p-1 shadow-sm transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{session.title}&rdquo; and all its messages
                          will be permanently deleted. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(session.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </button>
          );
        })}

        {/* Show more button */}
        {hasMoreSessions && !search && (
          <div className="px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowMore}
              disabled={sessionsQuery.isFetching}
              className="text-muted-foreground hover:text-foreground w-full text-xs"
            >
              {sessionsQuery.isFetching ? 'Loading...' : 'Show more'}
            </Button>
          </div>
        )}

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
