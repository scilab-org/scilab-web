import { useState } from 'react';
import { Send, Trash2, Edit2, MessageSquare, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useSectionComments } from '../api/get-section-comments';
import { useCreateSectionComment } from '../api/create-section-comment';
import { useUpdateSectionComment } from '../api/update-section-comment';
import { useDeleteSectionComment } from '../api/delete-section-comment';
import { CommentDto } from '../types';
import { useUser } from '@/lib/auth';

type SectionCommentsProps = {
  sectionId: string;
  isReadOnly?: boolean;
  className?: string;
};

const CommentItem = ({
  comment,
  sectionId,
  currentUser,
  isReadOnly,
}: {
  comment: CommentDto;
  sectionId: string;
  currentUser?: string;
  isReadOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = currentUser === comment.userName;

  const updateMutation = useUpdateSectionComment({ sectionId });
  const deleteMutation = useDeleteSectionComment({ sectionId });

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateMutation.mutate(
      { id: comment.id, data: editContent },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const avatarInitial = (comment.userName || '?').charAt(0).toUpperCase();

  return (
    <div className="group bg-editor-bg flex flex-col gap-2 rounded-lg border border-slate-200 p-3 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {avatarInitial}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {comment.userName}
              </span>
              {isOwner && (
                <span className="rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  You
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {comment.createdOnUtc
                ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(comment.createdOnUtc))
                : ''}
            </span>
          </div>
        </div>

        {/* Actions (visible on hover) */}
        {isOwner && !isEditing && (
          <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-slate-400 hover:bg-slate-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              onClick={() => setIsEditing(true)}
              title="Edit Feedback"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {!isReadOnly && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                onClick={handleDelete}
                title="Delete Feedback"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="mt-2 flex w-full flex-col gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/50">
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="bg-editor-content-bg h-8 border-slate-200 px-2 text-sm shadow-sm focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditContent(comment.content);
              }
            }}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-6 px-3 text-[11px]"
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-1 pr-2 pb-1 pl-9 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
          <p className="wrap-break-word whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      )}
    </div>
  );
};

export const SectionComments = ({
  sectionId,
  isReadOnly = false,
  className,
}: SectionCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const { data: user } = useUser();

  const commentsQuery = useSectionComments({ sectionId });
  const createMutation = useCreateSectionComment({ sectionId });

  const comments = commentsQuery.data?.result?.items ?? [];

  const handleCreate = () => {
    if (!newComment.trim()) return;
    createMutation.mutate(
      { data: { sectionId, content: newComment } },
      {
        onSuccess: () => {
          setNewComment('');
          document
            .getElementById(`comment-top-${sectionId}`)
            ?.scrollIntoView({ behavior: 'smooth' });
        },
      },
    );
  };

  return (
    <div
      className={`relative mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 ${className || ''}`}
    >
      <div id={`comment-top-${sectionId}`} className="absolute -top-4" />
      <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-500" />
          Comment{' '}
          {comments.length > 0 && (
            <span className="text-slate-500">({comments.length})</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px] text-slate-500 hover:text-emerald-600"
          onClick={() => commentsQuery.refetch()}
          disabled={commentsQuery.isFetching}
        >
          <RefreshCw
            className={`h-3 w-3 ${commentsQuery.isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {commentsQuery.isLoading ? (
        <div className="space-y-4 pt-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : commentsQuery.isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center dark:border-red-900/30 dark:bg-red-900/10">
          <p className="text-xs text-red-600 dark:text-red-400">
            Failed to load comments.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-1 pr-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              sectionId={sectionId}
              currentUser={user?.preferredUsername}
              isReadOnly={isReadOnly}
            />
          ))}
          {comments.length === 0 && (
            <div className="bg-editor-bg flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-800 dark:bg-slate-900/20">
              <MessageSquare className="h-6 w-6 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No comments yet.
                {!isReadOnly && (
                  <>
                    <br /> Be the first to review this section!
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Composer Input */}
      {!isReadOnly && (
        <div className="bg-editor-bg mt-2 flex shrink-0 flex-col gap-3 rounded-lg border border-slate-200 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
          <Input
            placeholder="Leave a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-editor-content-bg h-10 border-slate-200 px-3 text-sm shadow-sm focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:placeholder-slate-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreate();
              }
            }}
            disabled={createMutation.isPending}
          />
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              onClick={handleCreate}
              disabled={!newComment.trim() || createMutation.isPending}
            >
              Submit Review <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
