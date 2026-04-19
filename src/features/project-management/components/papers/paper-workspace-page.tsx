import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutList,
  Loader2,
  Star,
  UserPlus,
  Users,
  BookMarked,
  PenLine,
} from 'lucide-react';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BTN } from '@/lib/button-styles';
import { cn } from '@/utils/cn';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { useAssignedSections } from '@/features/paper-management/api/get-assigned-sections';
import { useGetPaperSections } from '@/features/paper-management/api/get-paper-sections';
import { getSection } from '@/features/paper-management/api/get-section';
import { useGetSectionMembers } from '@/features/paper-management/api/get-section-members';
import { useAvailableSectionMembers } from '@/features/paper-management/api/get-available-section-members';
import { useCreatePaperContributor } from '@/features/paper-management/api/create-paper-contributor';
import { useDeletePaperContributor } from '@/features/paper-management/api/delete-paper-contributor';
import { useUpdateSectionGuideline } from '@/features/paper-management/api/update-section-guideline';
import { useGetPaperContributors } from '@/features/paper-management/api/get-paper-contributors';
import { useMarkSection } from '@/features/paper-management/api/get-mark-section';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '@/features/paper-management/constants';
import {
  AssignedSection,
  AvailableSectionMember,
  MarkSectionItem,
  PaperSection,
  SectionMember,
} from '@/features/paper-management/types';
import { MarkMainSectionDialog } from '@/features/paper-management/components/mark-main-section-dialog';
import { LatexPaperEditor } from '@/features/project-management/components/papers/latex-paper-editor';

const stripLatex = (input: string): string => {
  if (!input) return '(Untitled)';
  let s = input;
  const cmdPat = /\\[a-zA-Z*]+\{([^{}]*)\}/g;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(cmdPat, '$1');
  }
  return s.replace(/[{}]/g, '').trim() || '(Untitled)';
};

// Format description: convert literal \n to real newlines
const formatDesc = (text: string) =>
  text.replace(/\\n/g, '\n').replace(/  +/g, ' ').trim();

const NULL_GUID = '00000000-0000-0000-0000-000000000000';

const getIdeaLines = (text: string) =>
  formatDesc(text)
    .replace(/^"+/, '')
    .trimStart()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// ── Section Members Sheet ────────────────────────────────────────────────────
const SectionMembersSheet = ({
  sectionId,
  sectionTitle,
  paperId,
  open,
  onClose,
  isAuthor,
}: {
  sectionId: string;
  sectionTitle: string;
  paperId: string;
  open: boolean;
  onClose: () => void;
  isAuthor?: boolean;
}) => {
  const [view, setView] = useState<'members' | 'assign'>('members');

  // Members view state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Assign view state
  const [search, setSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRole, setSelectedRole] = useState('section:edit');

  const membersQuery = useGetSectionMembers({
    sectionId: open && sectionId ? sectionId : '',
    paperId,
  });
  const members: SectionMember[] = membersQuery.data?.result?.items ?? [];
  const visibleMembers = members.filter((member) => {
    const normalizedUserId = member.userId?.trim().toLowerCase();
    const hasIdentity = Boolean(
      member.username?.trim() ||
      member.email?.trim() ||
      member.firstName?.trim() ||
      member.lastName?.trim(),
    );

    return normalizedUserId !== NULL_GUID && hasIdentity;
  });

  const availableQuery = useAvailableSectionMembers({
    sectionId: sectionId || '',
    paperId,
    queryConfig: {
      enabled: open && view === 'assign' && !!sectionId,
      staleTime: 0,
      gcTime: 0,
    } as any,
  });
  const availableMembers: AvailableSectionMember[] =
    availableQuery.data?.result?.items ?? [];

  const getSectionRolePriority = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized.includes('author')) return 0;
    if (normalized.includes('edit')) return 1;
    if (normalized.includes('read') || normalized.includes('view')) return 2;
    return 3;
  };
  const sortedMembers = [...visibleMembers].sort(
    (a, b) =>
      getSectionRolePriority(a.sectionRole) -
      getSectionRolePriority(b.sectionRole),
  );

  const filtered = availableMembers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.email?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    );
  });

  const deleteMutation = useDeletePaperContributor({
    sectionId,
    paperId,
    mutationConfig: {
      onSuccess: () => toast.success('Member removed successfully'),
      onError: () => toast.error('Failed to remove member'),
    },
  });

  const assignMutation = useCreatePaperContributor({
    paperId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Member assigned successfully');
        setView('members');
        setSelectedMemberIds(new Set());
        setSelectedRole('section:edit');
        setSearch('');
      },
      onError: () => toast.error('Failed to assign member'),
    },
  });

  const handleAssign = () => {
    if (selectedMemberIds.size === 0) return;
    assignMutation.mutate({
      paperId,
      sectionId,
      markSectionId: sectionId,
      memberIds: Array.from(selectedMemberIds),
      sectionRole: selectedRole,
    });
  };

  const canSubmit = selectedMemberIds.size > 0 && !assignMutation.isPending;

  const handleClose = () => {
    setView('members');
    setConfirmDeleteId(null);
    setSelectedMemberIds(new Set());
    setSelectedRole('section:edit');
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === 'assign' && (
              <button
                onClick={() => setView('members')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <Users className="size-5 text-green-600" />
            {view === 'assign' ? 'Assign Writers' : 'Section Writers'}
          </DialogTitle>
          <DialogDescription className="truncate text-xs">
            {sectionTitle}
          </DialogDescription>
        </DialogHeader>

        {view === 'members' ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {isAuthor && (
              <div className="flex justify-end pt-2 pb-3">
                <Button
                  size="action"
                  onClick={() => {
                    setSelectedMemberIds(new Set());
                    setView('assign');
                    availableQuery.refetch();
                  }}
                  className={cn('flex items-center gap-2', BTN.CREATE)}
                >
                  <UserPlus className="size-4" />
                  Assign Member
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {membersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : sortedMembers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p className="text-muted-foreground text-sm">
                    No members assigned to this section yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Member</TableHead>
                        <TableHead className="w-36">Role</TableHead>
                        {isAuthor && (
                          <TableHead className="w-24 text-center">
                            Actions
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMembers.map((m) => {
                        const isProjectRole =
                          m.sectionRole.startsWith('project:') ||
                          m.sectionRole.startsWith('paper:');
                        const displayRole = (() => {
                          const raw = m.sectionRole.includes(':')
                            ? m.sectionRole.split(':').pop()
                            : m.sectionRole;
                          if (raw === 'edit') return 'Writer';
                          if (raw === 'read' || raw === 'view') return 'Viewer';
                          if (raw === 'author') return 'Author';
                          if (raw === 'manager') return 'Manager';
                          return raw
                            ? raw.charAt(0).toUpperCase() + raw.slice(1)
                            : raw;
                        })();
                        return (
                          <TableRow key={m.id} className="hover:bg-muted/30">
                            <TableCell>
                              <p className="text-foreground text-sm font-medium">
                                {m.firstName || m.lastName
                                  ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
                                  : m.username}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {m.email}
                                {m.username && ` · @${m.username}`}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  displayRole === 'Author'
                                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400'
                                    : displayRole === 'Writer'
                                      ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                                      : displayRole === 'Viewer'
                                        ? 'border-muted-foreground/20 bg-muted/50 text-muted-foreground'
                                        : ''
                                }
                              >
                                {displayRole}
                              </Badge>
                            </TableCell>
                            {isAuthor && (
                              <TableCell className="text-center">
                                {!isProjectRole && (
                                  <Button
                                    size="action"
                                    variant="destructive"
                                    onClick={() => setConfirmDeleteId(m.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    {deleteMutation.isPending &&
                                    confirmDeleteId === m.id ? (
                                      <>
                                        <Loader2 className="mr-1 size-3 animate-spin" />
                                        REMOVE
                                      </>
                                    ) : (
                                      'REMOVE'
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-2">
              <div className="space-y-2">
                <p className="text-foreground text-sm font-medium">
                  Select Member
                </p>
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                />
              </div>
              <div className="flex-1 space-y-2">
                {availableQuery.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </>
                ) : filtered.length === 0 ? (
                  <div className="bg-muted/30 rounded-xl py-10 text-center">
                    <p className="text-muted-foreground text-sm">
                      No members found
                    </p>
                  </div>
                ) : (
                  filtered.map((m) => {
                    const isSelected = selectedMemberIds.has(m.memberId);
                    return (
                      <div
                        key={m.memberId}
                        className={cn(
                          'rounded-xl border transition-all duration-200',
                          isSelected
                            ? 'border-blue-400 bg-blue-50 shadow-sm dark:bg-blue-950/30'
                            : 'border-border hover:border-blue-300 hover:shadow-sm',
                        )}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedMemberIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.memberId)) {
                                next.delete(m.memberId);
                              } else {
                                next.add(m.memberId);
                              }
                              return next;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedMemberIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(m.memberId)) {
                                  next.delete(m.memberId);
                                } else {
                                  next.add(m.memberId);
                                }
                                return next;
                              });
                            }
                          }}
                          className="flex cursor-pointer items-center gap-3 px-4 py-3"
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase transition-colors',
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              (m.firstName?.[0] ?? m.username?.[0] ?? '?')
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground truncate text-sm font-medium">
                              {m.firstName} {m.lastName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {m.email}
                              {m.username && ` · @${m.username}`}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div
                            className="border-t border-blue-200 px-4 py-2 dark:border-blue-800/50"
                            role="presentation"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                Role:
                              </span>
                              <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                Writer
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                variant="outline"
                size="action"
                onClick={() => setView('members')}
                className={BTN.CANCEL}
              >
                Cancel
              </Button>
              <Button
                size="action"
                onClick={handleAssign}
                disabled={!canSubmit}
                className={BTN.CREATE}
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  'Assign'
                )}
              </Button>
            </div>
          </div>
        )}

        <AlertDialog
          open={!!confirmDeleteId}
          onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove member?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this member from the section?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (confirmDeleteId) {
                    deleteMutation.mutate(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

// ── Section Version Dialog ───────────────────────────────────────────────────
const SectionVersionDialog = ({
  open,
  onClose,
  sectionTitle,
  markSectionId,
  sectionStatus,
  currentMemberId,
  canEdit,
  isAssigned = false,
  hasOwnDraft = false,
  onOpenEditor,
}: {
  open: boolean;
  onClose: () => void;
  sectionTitle: string;
  markSectionId: string | null;
  sectionStatus?: number;
  currentMemberId?: string;
  canEdit: boolean;
  isAssigned?: boolean;
  isFullEditor?: boolean;
  hasOwnDraft?: boolean;
  onOpenEditor: (sectionId: string, readOnly: boolean) => void;
}) => {
  const versionsQuery = useMarkSection({
    markSectionId: open && markSectionId ? markSectionId : null,
  });

  const allItems: MarkSectionItem[] = versionsQuery.data?.result?.items ?? [];
  const versions = allItems.filter(
    (v) => v.markSectionId === markSectionId || v.sectionId === markSectionId,
  );

  const sorted = [...versions].sort(
    (a, b) =>
      new Date(a.createdOnUtc || '').getTime() -
      new Date(b.createdOnUtc || '').getTime(),
  );

  // Only treat versions as "mine" when the user actually has edit permission
  const myVersions = canEdit
    ? sorted.filter((v) => v.memberId === currentMemberId)
    : [];
  const mainVersions = sorted.filter(
    (v) => v.isMainSection && !(canEdit && v.memberId === currentMemberId),
  );
  const otherVersions = sorted.filter(
    (v) => !v.isMainSection && !(canEdit && v.memberId === currentMemberId),
  );
  const ordered = [...myVersions, ...mainVersions, ...otherVersions];

  const statusMap: Record<number, { label: string; cls: string }> = {
    1: {
      label: 'Not started',
      cls: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400',
    },
    2: {
      label: 'In progress',
      cls: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
    },
    3: {
      label: 'In review',
      cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
    },
    4: {
      label: 'Completed',
      cls: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400',
    },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{sectionTitle}</DialogTitle>
        </DialogHeader>

        {sectionStatus != null && statusMap[sectionStatus] && (
          <div className="flex items-center gap-2 border-b pb-3">
            <span className="text-muted-foreground text-xs font-medium">
              Status:
            </span>
            <Badge
              variant="outline"
              className={cn(
                'h-5 rounded-full px-2 py-0 text-xs',
                statusMap[sectionStatus].cls,
              )}
            >
              {statusMap[sectionStatus].label}
            </Badge>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {versionsQuery.isLoading ? (
            <div className="flex flex-col gap-3 pt-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : ordered.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="text-muted-foreground/40 mx-auto mb-3 size-10" />
              <p className="text-muted-foreground text-sm">
                No versions found for this section.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              {ordered.map((item) => {
                const isMe = canEdit && item.memberId === currentMemberId;
                const displayName =
                  item.name || item.email || item.createdBy || '';
                const showMainBadge = item.isMainSection && ordered.length > 1;
                return (
                  <div
                    key={item.sectionId}
                    className={cn(
                      'rounded-lg border p-4',
                      isMe
                        ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
                        : item.isMainSection
                          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                          : 'border-border bg-muted/20',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          {item.version && (
                            <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                              {item.version}
                            </span>
                          )}
                          {showMainBadge && (
                            <Badge
                              variant="outline"
                              className="h-4 rounded-full border-green-300 bg-green-100 px-1.5 py-0 text-[10px] font-semibold text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400"
                            >
                              Main
                            </Badge>
                          )}
                          {isMe && (
                            <Badge
                              variant="outline"
                              className="h-4 rounded-full border-blue-300 bg-blue-100 px-1.5 py-0 text-[10px] font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              You
                            </Badge>
                          )}
                          {item.status != null && statusMap[item.status] && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-4 rounded-full px-1.5 py-0 text-[10px] font-semibold',
                                statusMap[item.status].cls,
                              )}
                            >
                              {statusMap[item.status].label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground text-sm font-medium">
                          {displayName}
                        </p>
                        {item.email && (item.name || item.createdBy) && (
                          <p className="text-muted-foreground text-xs">
                            {item.email}
                          </p>
                        )}
                        {item.createdOnUtc && (
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            Created{' '}
                            {new Date(item.createdOnUtc).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </p>
                        )}
                      </div>
                      <Button
                        size="action"
                        variant="outline"
                        onClick={() => {
                          // Permission rules:
                          // Main section:
                          //   - own draft exists → always view-only
                          //   - no own draft + canEdit → editable (initial version)
                          // Non-main section (author behaves like member, extra: can edit others'):
                          //   - canEdit=false (e.g. References) → always view-only for everyone
                          //   - canEdit=true + isFullEditor (author/manager) → editable (own OR others')
                          //   - canEdit=true + isMe → editable (member's own version)
                          //   - otherwise → view-only
                          let itemReadOnly: boolean;
                          if (item.isMainSection) {
                            itemReadOnly = hasOwnDraft ? true : !isAssigned;
                          } else {
                            // Authors do NOT get special edit rights on other people's versions.
                            // Only the owner of a version (isMe) may edit it.
                            itemReadOnly = !(canEdit && isMe);
                          }
                          onOpenEditor(item.sectionId, itemReadOnly);
                          onClose();
                        }}
                      >
                        {(() => {
                          if (item.isMainSection) {
                            return !hasOwnDraft && isAssigned
                              ? 'Open Editor'
                              : 'View';
                          }
                          return canEdit && isMe ? 'Open Editor' : 'View';
                        })()}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

type EditorState = { initialSectionId: string; readOnly: boolean } | null;

export const PaperWorkspacePage = ({
  projectId,
  paperId,
  isManager = false,
  isAuthor = false,
  backPath,
  embedded = false,
  initialSectionId,
  onInitialSectionOpened,
  onEditorClose,
}: {
  projectId: string;
  paperId: string;
  isManager?: boolean;
  isAuthor?: boolean;
  backPath: string;
  embedded?: boolean;
  initialSectionId?: string;
  onInitialSectionOpened?: () => void;
  onEditorClose?: () => void;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editorState, setEditorState] = useState<EditorState>(null);
  const [freshSections, setFreshSections] = useState<PaperSection[] | null>(
    null,
  );
  const [memberSheet, setMemberSheet] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [guidelineSheet, setGuidelineSheet] = useState<{
    id: string;
    title: string;
    description: string;
    mainIdea: string;
  } | null>(null);
  const [guidelineText, setGuidelineText] = useState('');
  const [guidelineMainIdea, setGuidelineMainIdea] = useState('');
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    new Set(),
  );
  const [versionDialog, setVersionDialog] = useState<{
    id: string;
    markSectionId: string;
    title: string;
    memberId: string;
    canEdit: boolean;
    isAssigned: boolean;
    status?: number;
    hasOwnDraft: boolean;
  } | null>(null);
  const [injectedSections, setInjectedSections] = useState<
    (typeof editorSections)[0][]
  >([]);
  const [markMainOpen, setMarkMainOpen] = useState(false);

  const paperQuery = useWritingPaperDetail({ paperId });

  // Always fetch all sections so every assigned member can see the full paper
  const allSectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: { enabled: !!paperId },
  });

  // For non-managers: also fetch the sections the current user is specifically assigned to
  const assignedSectionsQuery = useAssignedSections({
    paperId,
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: !!paperId && !isManager },
  });

  // Build a lookup map from assigned-sections keyed by both id and markSectionId
  const assignedByIdMap = useMemo<Map<string, AssignedSection>>(() => {
    const items = assignedSectionsQuery.data?.result?.items ?? [];
    const map = new Map<string, AssignedSection>();
    items.forEach((s) => {
      map.set(s.id, s);
      if (s.markSectionId) map.set(s.markSectionId, s);
    });
    return map;
  }, [assignedSectionsQuery.data]);

  // IDs of sections where this user has edit rights (for renderSectionCard)
  const editableSectionIds = useMemo<Set<string>>(() => {
    const items = assignedSectionsQuery.data?.result?.items ?? [];
    const ids = new Set<string>();
    items
      .filter(
        (s) =>
          s.sectionRole === 'section:edit' ||
          s.sectionRole === 'paper:author' ||
          s.sectionRole === 'project:manager',
      )
      .forEach((s) => {
        if (s.id) ids.add(s.id);
        if (s.markSectionId) ids.add(s.markSectionId);
      });
    return ids;
  }, [assignedSectionsQuery.data]);

  const workspaceSections = useMemo(() => {
    const allItems =
      freshSections ?? allSectionsQuery.data?.result?.items ?? [];

    // Managers: all sections editable
    if (isManager) {
      return allItems.map(
        (s) =>
          ({
            ...s,
            paperId: s.paperId || paperId,
            // markSectionId must be stable and non-empty for version-id resolution.
            // When not provided by backend for managers, fallback to the current id.
            markSectionId: s.id,
            paperContributorId: '',
            memberId: '',
            sectionRole: 'project:manager',
            filePath: s.filePath || null,
            parentSectionId: s.parentSectionId || null,
            sectionSumary: s.sectionSumary || '',
            description: (s as any).description || s.sectionSumary || '',
            mainIdea: (s as any).mainIdea || '',
            content: s.content || '',
            numbered: s.numbered,
            displayOrder: s.displayOrder,
          }) as AssignedSection,
      );
    }

    // Authors and members: show all sections but use assigned data when available;
    // sections not in assigned-sections are view-only
    return allItems.map((s) => {
      const assigned = assignedByIdMap.get(s.id);
      if (assigned) {
        return {
          // Always trust latest section payload for content/title/structure.
          // Assigned payload is used only for permission and member metadata.
          ...s,
          paperId: s.paperId || assigned.paperId || paperId,
          markSectionId: assigned.markSectionId || '',
          paperContributorId: assigned.paperContributorId || '',
          memberId: assigned.memberId || '',
          sectionRole: assigned.sectionRole || 'section:view',
          filePath: s.filePath || null,
          parentSectionId: s.parentSectionId || null,
          sectionSumary: s.sectionSumary || '',
          description: (assigned as any).description || s.sectionSumary || '',
          mainIdea: (assigned as any).mainIdea || '',
          content: s.content || '',
          numbered: s.numbered,
          displayOrder: s.displayOrder,
          packages: assigned.packages ?? (s as any).packages ?? null,
          status: assigned.status ?? (s as any).status,
        } as AssignedSection;
      }
      return {
        ...s,
        paperId: s.paperId || paperId,
        // Ensure non-empty markSectionId so editor can resolve newest version id via assigned-sections.
        markSectionId: s.id,
        paperContributorId: '',
        memberId: '',
        sectionRole: 'section:view',
        filePath: s.filePath || null,
        parentSectionId: s.parentSectionId || null,
        sectionSumary: s.sectionSumary || '',
        description: (s as any).description || s.sectionSumary || '',
        mainIdea: (s as any).mainIdea || '',
        content: s.content || '',
        numbered: s.numbered,
        displayOrder: s.displayOrder,
      } as AssignedSection;
    });
  }, [
    freshSections,
    isManager,
    assignedByIdMap,
    allSectionsQuery.data,
    paperId,
  ]);

  const paper = paperQuery.data?.result?.paper;
  const subProjectId = paper?.subProjectId || projectId;

  const updateGuidelineMutation = useUpdateSectionGuideline({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Guideline updated');
        setGuidelineSheet(null);
      },
      onError: () => toast.error('Failed to update guideline'),
    },
  });

  const paperContributorsQuery = useGetPaperContributors({
    paperId,
    queryConfig: { enabled: !!paperId } as any,
  });

  // Map sectionId -> writer/author count from paper contributors.
  // Index by both sectionId and markSectionId to maximize lookup coverage.
  const sectionContributorCounts = useMemo(() => {
    const items = (paperContributorsQuery.data as any)?.result?.items ?? [];
    const isWritingContributor = (role?: string) =>
      role === 'section:edit' || role === 'paper:author';

    // Use sets to deduplicate the same contributor across multiple assignments.
    const perSection = new Map<string, Set<string>>();
    items.forEach((c: any) => {
      if (!isWritingContributor(c.sectionRole)) return;

      const contributorKey = c.userId || c.memberId || c.id;
      if (!contributorKey) return;

      [c.sectionId, c.markSectionId]
        .filter(Boolean)
        .forEach((secId: string) => {
          if (!perSection.has(secId)) perSection.set(secId, new Set());
          perSection.get(secId)!.add(contributorKey);
        });
    });
    const map = new Map<string, number>();
    perSection.forEach((set, key) => map.set(key, set.size));
    return map;
  }, [paperContributorsQuery.data]);

  const Wrapper = embedded ? React.Fragment : ContentLayout;
  const wrapperProps = embedded ? {} : { title: 'Workspace' };

  const isLoading =
    paperQuery.isLoading ||
    allSectionsQuery.isLoading ||
    (!isManager && assignedSectionsQuery.isLoading);

  const editorSections = useMemo(
    () =>
      workspaceSections.map((s) => ({
        id: s.id,
        markSectionId: s.markSectionId || s.id,
        paperId: s.paperId,
        title: stripLatex(s.title),
        content: s.content || '',
        memberId: s.memberId,
        numbered: s.numbered,
        displayOrder: s.displayOrder,
        sectionSumary: s.sectionSumary || '',
        parentSectionId: s.parentSectionId,
        sectionRole: s.sectionRole,
        description: (s as any).description || s.sectionSumary || '',
        mainIdea: (s as any).mainIdea || '',
        createdOnUtc: s.createdOnUtc || null,
        lastModifiedOnUtc: s.lastModifiedOnUtc || null,
        packages: s.packages ?? undefined,
        status: s.status,
      })),
    [workspaceSections],
  );

  const resolvedInitialSectionId = useMemo(() => {
    if (!editorState) return undefined;

    const all = [...editorSections, ...injectedSections];
    const section = all.find(
      (s) =>
        s.id === editorState.initialSectionId ||
        s.markSectionId === editorState.initialSectionId,
    );
    if (section) return section.id;

    return editorSections[0]?.id;
  }, [editorSections, injectedSections, editorState]);

  // Compute sequential numbers for numbered sections
  const sectionNumbers = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = (arr: typeof editorSections) =>
      [...arr].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const roots = sorted(editorSections.filter((s) => !s.parentSectionId));
    let rootCount = 0;
    roots.forEach((root) => {
      if (root.numbered) rootCount++;
      const rootNum = root.numbered ? `${rootCount}` : '';
      if (rootNum) map.set(root.id, rootNum);
      const children = sorted(
        editorSections.filter((s) => s.parentSectionId === root.id),
      );
      let childCount = 0;
      children.forEach((child) => {
        if (child.numbered) childCount++;
        if (child.numbered)
          map.set(
            child.id,
            rootNum ? `${rootNum}.${childCount}` : `${childCount}`,
          );
      });
    });
    return map;
  }, [editorSections]);

  const openSectionEditor = async (sectionId: string, readOnly: boolean) => {
    let resolvedSectionId = sectionId;

    // Check if this sectionId already exists in the workspace sections.
    // If not (e.g. a foreign member's version), skip assigned-sections resolution.
    const isWorkspaceSection = editorSections.some(
      (s) => s.id === sectionId || s.markSectionId === sectionId,
    );

    // Also check if sectionId is the current user's own assigned-version ID.
    // The version dialog may pass the version-specific id (assigned.id) which
    // differs from the base section id used in editorSections.
    const ownAssigned =
      !isWorkspaceSection && !readOnly
        ? assignedByIdMap.get(sectionId)
        : undefined;
    const isOwnSection = isWorkspaceSection || !!ownAssigned;

    // When readOnly, use the exact sectionId — the user wants to view that
    // specific version (e.g. Main), not their own assigned version.
    if (isOwnSection && !readOnly) {
      // Use cached assigned-sections data — no extra network call needed.
      const assignedItems = assignedSectionsQuery.data?.result?.items ?? [];

      const workspaceSection = ownAssigned
        ? editorSections.find(
            (s) =>
              s.id === ownAssigned.markSectionId ||
              s.markSectionId === ownAssigned.markSectionId,
          )
        : editorSections.find((s) => s.id === sectionId);
      const markSectionId = workspaceSection?.markSectionId || sectionId;

      const exactMatch = assignedItems.find((item) => item.id === sectionId);
      const markMatch = assignedItems.find(
        (item) => (item.markSectionId || item.id) === markSectionId,
      );

      resolvedSectionId = exactMatch?.id || markMatch?.id || sectionId;
    }

    // The base section id in allSectionsQuery that should be updated
    const baseSectionId = ownAssigned?.markSectionId ?? sectionId;

    try {
      const response = await getSection(resolvedSectionId);
      const latestSection = response.result;

      const existsInWorkspace = isOwnSection && !readOnly;
      if (existsInWorkspace) {
        setFreshSections((prev) => {
          const baseSections =
            prev ?? allSectionsQuery.data?.result?.items ?? [];
          if (baseSections.length === 0) return prev;

          return baseSections.map((section) =>
            section.id === baseSectionId || section.id === resolvedSectionId
              ? {
                  ...section,
                  id: latestSection.id || resolvedSectionId,
                  title: latestSection.title,
                  content: latestSection.content,
                  numbered: latestSection.numbered,
                  displayOrder: latestSection.displayOrder,
                  sectionSumary: latestSection.sectionSumary,
                  parentSectionId: latestSection.parentSectionId,
                }
              : section,
          );
        });
      } else {
        // Foreign version: inject into editor sections so it can be loaded.
        // When readOnly=false (author/manager editing someone else's draft),
        // give the section an editable role so the editor allows editing.
        setInjectedSections([
          {
            id: latestSection.id || resolvedSectionId,
            markSectionId: resolvedSectionId,
            paperId: (latestSection.paperId as string) || paperId,
            title: stripLatex(latestSection.title),
            content: latestSection.content || '',
            memberId: latestSection.memberId || '',
            numbered: latestSection.numbered ?? false,
            displayOrder: latestSection.displayOrder ?? 9999,
            sectionSumary: latestSection.sectionSumary || '',
            parentSectionId: latestSection.parentSectionId ?? null,
            sectionRole: readOnly ? 'section:view' : 'paper:author',
            description:
              (latestSection as any).description ||
              latestSection.sectionSumary ||
              '',
            mainIdea: (latestSection as any).mainIdea || '',
            createdOnUtc: latestSection.createdOnUtc ?? null,
            lastModifiedOnUtc: latestSection.lastModifiedOnUtc ?? null,
            packages: latestSection.packages ?? undefined,
            status: undefined,
          },
        ]);
      }
    } catch {
      // Open the editor even if the section fetch fails; it will use current data.
    }

    const wsSection = [...editorSections, ...injectedSections].find(
      (s) =>
        s.id === resolvedSectionId || s.markSectionId === resolvedSectionId,
    );
    setEditorState({
      initialSectionId: wsSection?.id ?? resolvedSectionId,
      readOnly,
    });
  };

  // Auto-open a specific section editor when initialSectionId prop is provided
  const [pendingAutoOpenSectionId, setPendingAutoOpenSectionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (initialSectionId) setPendingAutoOpenSectionId(initialSectionId);
  }, [initialSectionId]);

  useEffect(() => {
    if (!pendingAutoOpenSectionId) return;
    if (isLoading) return;
    if (editorSections.length === 0) return;
    const sectionId = pendingAutoOpenSectionId;
    setPendingAutoOpenSectionId(null);
    openSectionEditor(sectionId, false);
    onInitialSectionOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoOpenSectionId, isLoading, editorSections.length]);

  const handleEditorSave = async () => {
    // Mark queries stale but do NOT trigger background refetches while the
    // editor is open. The editor manages its own section state after save;
    // a background refetch would push structural IDs into the sections prop
    // and cause the editor to call APIs with stale/wrong section IDs.
    // Queries will auto-refetch when the editor closes (see onClose below).
    queryClient.invalidateQueries({
      queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS, paperId],
      refetchType: 'none',
    });
  };

  // If editor is open, render it (fixed inset-0, overlays everything)
  if (editorState) {
    return (
      <LatexPaperEditor
        readOnly={editorState.readOnly}
        paperTitle={paper?.title || 'Untitled'}
        projectId={projectId}
        sections={[...editorSections, ...injectedSections]}
        initialSectionId={resolvedInitialSectionId}
        onSave={handleEditorSave}
        onClose={() => {
          setEditorState(null);
          setFreshSections(null);
          setInjectedSections([]);
          // Now that the editor is closed, force fresh data for the workspace.
          queryClient.invalidateQueries({
            queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS, paperId],
          });
          queryClient.invalidateQueries({
            queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS],
          });
          onEditorClose?.();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </Wrapper>
    );
  }

  if (!paper) {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Paper not found</p>
          {!embedded && (
            <Button onClick={() => navigate(backPath)} className="mt-4">
              Go Back
            </Button>
          )}
        </div>
      </Wrapper>
    );
  }

  const SECTION_STATUS_MAP: Record<number, { label: string; cls: string }> = {
    1: {
      label: 'Not started',
      cls: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400',
    },
    2: {
      label: 'In progress',
      cls: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
    },
    3: {
      label: 'In review',
      cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
    },
    4: {
      label: 'Completed',
      cls: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400',
    },
  };

  const canEditSection = (role: string) =>
    role === 'section:edit' ||
    role === 'paper:author' ||
    role === 'project:manager';

  // Group by parent for display
  const rootSections = editorSections.filter((s) => !s.parentSectionId);
  const childSections = (parentId: string) =>
    editorSections.filter((s) => s.parentSectionId === parentId);

  const toggleSectionCollapse = (sectionId: string) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const renderSectionCard = (
    s: (typeof editorSections)[0],
    isChild = false,
  ) => {
    const normalizedTitle = stripLatex(s.title || '').toLowerCase();
    const isReferencesSection =
      normalizedTitle === 'references' || normalizedTitle === 'reference';
    const canEdit =
      !isReferencesSection &&
      (canEditSection(s.sectionRole || '') ||
        editableSectionIds.has(s.id) ||
        editableSectionIds.has(s.markSectionId || ''));
    const num = sectionNumbers.get(s.id);
    const contributorCount =
      sectionContributorCounts.get(s.id) ??
      sectionContributorCounts.get(s.markSectionId || '') ??
      0;
    const isCollapsed = !expandedSectionIds.has(s.id);
    const mainIdeaLines = (s as any).mainIdea
      ? getIdeaLines((s as any).mainIdea)
      : [];
    return (
      <div
        key={s.id}
        className={cn(
          'bg-card border-border/70 overflow-hidden border transition-shadow hover:shadow-md',
          isChild
            ? 'ml-6 border-l-2 border-l-blue-200 dark:border-l-blue-800'
            : 'border-border shadow-sm',
        )}
      >
        <div
          className="flex cursor-pointer items-start gap-4 px-5 py-5"
          onClick={() => toggleSectionCollapse(s.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSectionCollapse(s.id);
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground text-xl leading-none font-semibold">
              {s.numbered ? `${num ? ` ${num}.` : ''} ${s.title}` : s.title}
            </h3>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {s.lastModifiedOnUtc && (
                <span>
                  Modified{' '}
                  {new Date(s.lastModifiedOnUtc).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {s.status != null && SECTION_STATUS_MAP[s.status] && (
                <Badge
                  variant="outline"
                  className={cn(
                    'h-6 rounded-full px-2.5 py-0 text-xs font-medium',
                    SECTION_STATUS_MAP[s.status].cls,
                  )}
                >
                  {SECTION_STATUS_MAP[s.status].label}
                </Badge>
              )}
              {contributorCount > 0 && (
                <span className="flex items-center">
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    title={`${contributorCount} writer/author${contributorCount !== 1 ? 's' : ''}`}
                    aria-label={`${contributorCount} writer or author${contributorCount !== 1 ? 's' : ''}`}
                  >
                    {contributorCount}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="action"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                const assigned =
                  assignedByIdMap.get(s.id) ||
                  assignedByIdMap.get(s.markSectionId || s.id);
                const sectionHasOwnDraft =
                  !!assigned &&
                  !!assigned.markSectionId &&
                  assigned.id !== assigned.markSectionId;
                setVersionDialog({
                  id: s.id,
                  markSectionId: s.markSectionId || s.id,
                  title: stripLatex(s.title),
                  memberId: s.memberId || '',
                  canEdit,
                  isAssigned: !!assigned,
                  status: s.status,
                  hasOwnDraft: sectionHasOwnDraft,
                });
              }}
              className="bg-background/70 hover:bg-muted shrink-0 rounded-lg px-3 text-xs font-semibold tracking-wide uppercase"
            >
              VIEW
            </Button>
            <Button
              size="action"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setMemberSheet({
                  id: s.markSectionId || s.id,
                  title: stripLatex(s.title),
                });
              }}
              title="Writers"
              className="bg-background/70 hover:bg-muted shrink-0 rounded-lg px-3 text-xs font-semibold tracking-wide uppercase"
            >
              Writer
            </Button>

            {isAuthor && (
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setGuidelineText(s.description || s.sectionSumary || '');
                  setGuidelineMainIdea((s as any).mainIdea || '');
                  setGuidelineSheet({
                    id: s.id,
                    title: stripLatex(s.title),
                    description: s.description || s.sectionSumary || '',
                    mainIdea: (s as any).mainIdea || '',
                  });
                }}
                title="Open Description"
                aria-label="Open Description"
                className="bg-background/70 hover:bg-muted size-10 rounded-2xl"
              >
                <PenLine className="size-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                toggleSectionCollapse(s.id);
              }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
              className="bg-background/70 hover:bg-muted size-10 rounded-full"
            >
              <ChevronDown
                className={cn(
                  'size-4 transition-transform',
                  isCollapsed && '-rotate-90',
                )}
              />
            </Button>
          </div>
        </div>

        {!isCollapsed &&
          (mainIdeaLines.length > 0 || childSections(s.id).length > 0) && (
            <div className="border-border/70 border-t px-5 py-4">
              {mainIdeaLines.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-bold tracking-[0.12em] uppercase">
                    Main Idea
                  </p>
                  {mainIdeaLines.some(
                    (line) => line.startsWith('-') || line.startsWith('*'),
                  ) ? (
                    <ul className="text-foreground marker:text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-7">
                      {mainIdeaLines.map((line, index) => (
                        <li key={`${s.id}-idea-${index}`}>
                          {line.replace(/^[-*]\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-foreground space-y-2 text-sm leading-7">
                      {mainIdeaLines.map((line, index) => (
                        <p key={`${s.id}-idea-${index}`}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {childSections(s.id).length > 0 && (
                <div className={cn(mainIdeaLines.length > 0 && 'mt-5')}>
                  <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
                    <ChevronRight className="size-3" />
                    Sub-sections
                  </p>
                  <div className="space-y-3">
                    {childSections(s.id).map((child) =>
                      renderSectionCard(child, true),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    );
  };

  return (
    <Wrapper {...(wrapperProps as any)}>
      <div className="space-y-6">
        {/* Header */}
        {!embedded && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backPath)}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Back to Paper
              </Button>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <LayoutList className="size-4" />
              <span>
                {editorSections.length} section
                {editorSections.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Paper title banner */}
        {!embedded && (
          <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="bg-linear-to-r from-blue-50 to-indigo-50/40 px-6 py-4 dark:from-blue-950/30 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
                  <BookOpen className="size-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-foreground text-xl font-bold">
                    {paper.title}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Click Edit on any section to open the editor
                  </p>
                </div>
                {(isAuthor || isManager) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMarkMainOpen(true)}
                    className="shrink-0 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                  >
                    <Star className="size-4" />
                    Mark Main Section
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sections list */}
        {editorSections.length === 0 ? (
          <div className="border-border bg-card rounded-xl border py-16 text-center shadow-sm">
            <LayoutList className="text-muted-foreground/40 mx-auto mb-3 size-10" />
            <p className="text-muted-foreground font-medium">
              No sections assigned
            </p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              You do not have any sections assigned to this paper yet.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rootSections.map((s) => renderSectionCard(s))}
            {/* Sections with unknown parent (not in root list) */}
            {editorSections
              .filter(
                (s) =>
                  s.parentSectionId &&
                  !editorSections.find((p) => p.id === s.parentSectionId),
              )
              .map((s) => renderSectionCard(s))}
          </div>
        )}
      </div>

      {/* Section Members Sheet */}
      {memberSheet && (
        <SectionMembersSheet
          sectionId={memberSheet.id}
          sectionTitle={memberSheet.title}
          paperId={paperId}
          open={!!memberSheet}
          onClose={() => setMemberSheet(null)}
          isAuthor={isAuthor || isManager}
        />
      )}

      {/* Section Version Dialog */}
      {versionDialog && (
        <SectionVersionDialog
          open={!!versionDialog}
          onClose={() => setVersionDialog(null)}
          sectionTitle={versionDialog.title}
          markSectionId={versionDialog.markSectionId}
          sectionStatus={versionDialog.status}
          currentMemberId={versionDialog.memberId}
          canEdit={versionDialog.canEdit}
          isAssigned={versionDialog.isAssigned}
          isFullEditor={isAuthor || isManager}
          hasOwnDraft={versionDialog.hasOwnDraft}
          onOpenEditor={(sectionId, readOnly) => {
            setVersionDialog(null);
            void openSectionEditor(sectionId, readOnly);
          }}
        />
      )}

      {/* Mark Main Section Dialog */}
      <MarkMainSectionDialog
        paperId={paperId}
        subProjectId={subProjectId}
        isOpen={markMainOpen}
        onOpenChange={setMarkMainOpen}
      />

      {/* Update Guideline Dialog */}
      <Dialog
        open={!!guidelineSheet}
        onOpenChange={(v) => !v && setGuidelineSheet(null)}
      >
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="size-5 text-violet-600" />
              Section Description
            </DialogTitle>
            <DialogDescription className="truncate text-xs">
              {guidelineSheet?.title}
            </DialogDescription>
          </DialogHeader>

          <form
            id="guideline-form"
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!guidelineSheet) return;
              updateGuidelineMutation.mutate({
                sectionId: guidelineSheet.id,
                description: guidelineText,
                mainIdea: guidelineMainIdea,
              });
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="guideline-main-idea"
                className="text-sm font-medium"
              >
                Main Idea
              </label>
              <textarea
                id="guideline-main-idea"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-32 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={guidelineMainIdea}
                onChange={(e) => setGuidelineMainIdea(e.target.value)}
                placeholder="Enter the main idea for this section..."
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="guideline-desc" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="guideline-desc"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-32 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={guidelineText}
                onChange={(e) => setGuidelineText(e.target.value)}
                placeholder="Enter writing guideline for this section..."
              />
            </div>
          </form>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className={BTN.CANCEL}
              onClick={() => setGuidelineSheet(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="guideline-form"
              variant="darkRed"
              className="uppercase"
              disabled={updateGuidelineMutation.isPending}
            >
              {updateGuidelineMutation.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
};
