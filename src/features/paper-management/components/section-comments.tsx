import { useState } from 'react';
import {
  Send,
  Trash2,
  Edit2,
  MessageSquare,
  RefreshCw,
  Reply,
  X,
  ArrowUpRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useSectionComments } from '../api/get-section-comments';
import { useCreateSectionComment } from '../api/create-section-comment';
import { useUpdateSectionComment } from '../api/update-section-comment';
import { useDeleteSectionComment } from '../api/delete-section-comment';
import { CommentDto } from '../types';
import { useUser } from '@/lib/auth';

type ReplyTarget = {
  userName: string;
  sectionId: string;
};

type SectionCommentsProps = {
  sectionId: string;
  markSectionId?: string;
  isReadOnly?: boolean;
  className?: string;
  onGoToSection?: (comment: CommentDto) => void;
};

const CommentItem = ({
  comment,
  sectionId,
  currentUser,
  isReadOnly,
  onReply,
  onGoToSection,
}: {
  comment: CommentDto;
  sectionId: string;
  currentUser?: string;
  isReadOnly?: boolean;
  onReply?: (target: ReplyTarget) => void;
  onGoToSection?: () => void;
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
    <div className={`flex w-full ${isOwner ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group bg-editor-content-bg inline-flex max-w-[65%] min-w-0 flex-col gap-2 rounded-lg border px-5 py-3 shadow-sm transition-all hover:border-[#d9cfc2]`}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between ${isOwner ? 'flex-row-reverse' : ''}`}
        >
          <div
            className={`flex items-center gap-2.5 ${isOwner ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isOwner
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {avatarInitial}
            </div>
            <div className={`flex flex-col ${isOwner ? 'items-end' : ''}`}>
              <div
                className={`flex items-center gap-1.5 ${isOwner ? 'flex-row-reverse' : ''}`}
              >
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

          {/* Actions: edit/delete — hover only, owner only */}
          <div className="flex items-center gap-1">
            {!isEditing && isOwner && (
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
        </div>

        {/* View section badge — own row */}
        {!isEditing && onGoToSection && comment.sectionId !== sectionId && (
          <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={onGoToSection}
              className="inline-flex cursor-pointer items-center gap-0.5 rounded-full border border-[#d9cfc2] bg-[#f5ede0] px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors hover:bg-[#ecdfd0] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowUpRight className="h-3 w-3" />
              View section
            </button>
          </div>
        )}

        {/* Body */}
        {isEditing ? (
          <div className="bg-editor-content-bg mt-2 flex w-full flex-col gap-2 rounded-md p-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-editor-content-bg h-8 border-slate-200 px-2 text-sm shadow-sm focus-visible:ring-emerald-500"
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
                size="sm"
                className="h-6 gap-1 bg-emerald-600 px-3 text-[11px] text-white hover:bg-emerald-700"
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`mt-1 pb-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 ${
              isOwner ? 'pr-9 pl-2 text-right' : 'pr-2 pl-9'
            }`}
          >
            {comment.replyToUserName && (
              <p className="mb-1 text-[11px] text-slate-400 dark:text-slate-500">
                Replying to{' '}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  @{comment.replyToUserName}
                </span>
              </p>
            )}
            <p className="wrap-break-word whitespace-pre-wrap">
              {comment.content}
            </p>
            {!isReadOnly && onReply && (
              <button
                className={`mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isOwner ? 'ml-auto' : ''
                }`}
                onClick={() =>
                  onReply({
                    userName: comment.userName,
                    sectionId: comment.sectionId,
                  })
                }
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SectionComments = ({
  sectionId,
  markSectionId,
  isReadOnly = false,
  className,
  onGoToSection,
}: SectionCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const { data: user } = useUser();

  const queryMarkSectionId = markSectionId || sectionId;
  const commentsQuery = useSectionComments({
    sectionId,
    markSectionId: queryMarkSectionId,
  });
  const createMutation = useCreateSectionComment({
    sectionId: queryMarkSectionId,
  });

  const comments = commentsQuery.data?.result?.items ?? [];

  const handleCreate = () => {
    if (!newComment.trim()) return;
    const payload = replyTo
      ? {
          sectionId: replyTo.sectionId,
          content: newComment,
          markSectionId: markSectionId || sectionId,
          repliedToUserName: replyTo.userName,
        }
      : {
          sectionId,
          content: newComment,
          markSectionId: markSectionId || sectionId,
        };
    createMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          setNewComment('');
          setReplyTo(null);
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
          {comments
            .slice()
            .reverse()
            .map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                sectionId={sectionId}
                currentUser={user?.preferredUsername}
                isReadOnly={isReadOnly}
                onReply={
                  !isReadOnly ? (target) => setReplyTo(target) : undefined
                }
                onGoToSection={
                  onGoToSection ? () => onGoToSection(comment) : undefined
                }
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
          {replyTo && (
            <div className="flex items-center justify-between rounded bg-emerald-50 px-2 py-1 text-[11px] dark:bg-emerald-900/20">
              <span className="text-slate-600 dark:text-slate-300">
                Replying to{' '}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  @{replyTo.userName}
                </span>
              </span>
              <button
                className="text-slate-400 hover:text-red-500"
                onClick={() => setReplyTo(null)}
                title="Cancel reply"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <Input
            placeholder={
              replyTo
                ? `Reply to @${replyTo.userName}...`
                : 'Leave a comment...'
            }
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
