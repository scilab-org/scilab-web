import { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  Search,
  Check,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
import { useUser } from '@/lib/auth';
import { usePaperMembers } from '../../api/papers/get-paper-members';
import { usePaperMembersAvailable } from '../../api/papers/get-paper-members-available';
import { useAddSubProjectMembers } from '../../api/papers/add-sub-project-members';
import { useRemovePaperMembers } from '../../api/papers/remove-paper-members';
import { ProjectMember } from '../../types';

const AUTHOR_ROLE = 'project:author';
const PROJECT_MEMBER_ROLE = 'project:member';
const PAPER_AUTHOR_GROUP = 'paper:author';
const PAPER_MEMBER_GROUP = 'paper:member';

type Panel = 'view' | 'add';

const getRoleColor = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('author'))
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  if (r.includes('manager'))
    return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  if (r.includes('member'))
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
  return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
};

const formatRole = (role: string): string => {
  const r = (role || '').toLowerCase();
  if (r.includes('author')) return 'Author';
  if (r.includes('member')) return 'Contributor';
  if (r.includes('manager')) return 'Manager';
  if (r.includes('admin')) return 'Admin';
  const stripped = role.replace(/^(?:paper:|project:)/i, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
};

type PaperMembersSheetProps = {
  /** Sub-project ID */
  subProjectId: string;
  isManager: boolean;
  isAuthor: boolean;
  paperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PaperMembersSheet = ({
  subProjectId,
  isManager,
  isAuthor,
  paperTitle: _paperTitle,
  open,
  onOpenChange,
}: PaperMembersSheetProps) => {
  const { data: user } = useUser();
  const isSystemAdmin = user?.groups?.includes('system:admin') ?? false;

  // Manager adds authors; author adds members
  const canAddMembers = (isManager || isAuthor) && !isSystemAdmin;
  const addRoleFilter = isManager ? AUTHOR_ROLE : PROJECT_MEMBER_ROLE;
  const addGroupName = isManager ? PAPER_AUTHOR_GROUP : PAPER_MEMBER_GROUP;
  const [panel, setPanel] = useState<Panel>('view');
  const [searchText, setSearchText] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(
    null,
  );

  // ── GET /sub-projects/{subProjectId}/members ─────────────────────────────
  // Only called when user explicitly opens the View panel
  const membersQuery = usePaperMembers({
    subProjectId,
    params: { pageSize: 200 },
    queryConfig: { enabled: open && panel === 'view' },
  });
  const members = useMemo(
    () => ((membersQuery.data as any)?.result?.items ?? []) as ProjectMember[],
    [membersQuery.data],
  );
  const sortedMembers = useMemo(() => {
    const getRolePriority = (role: string) => {
      const normalized = (role || '').toLowerCase();
      if (normalized.includes('author')) return 0;
      if (normalized.includes('member')) return 1;
      return 2;
    };

    return [...members].sort((a, b) => {
      const roleDiff = getRolePriority(a.role) - getRolePriority(b.role);
      if (roleDiff !== 0) return roleDiff;

      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [members]);

  // ── GET /sub-projects/{subProjectId}/members/available ───────────────────
  // Manager → shows project:author; Author → shows project:member
  const parentAuthorsQuery = usePaperMembersAvailable({
    subProjectId,
    params: { projectRole: addRoleFilter, pageSize: 1000 },
    queryConfig: { enabled: open && panel === 'add' },
  });
  const parentAuthors: ProjectMember[] =
    (parentAuthorsQuery.data as any)?.result?.items ?? [];

  const alreadyAddedIds = new Set(members.map((m) => m.userId));
  const availableAuthors = parentAuthors.filter((a) => {
    if (alreadyAddedIds.has(a.userId)) return false;
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      a.email?.toLowerCase().includes(q) ||
      a.username?.toLowerCase().includes(q) ||
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q)
    );
  });

  // ── POST /sub-projects/{subProjectId}/members ────────────────────────────
  const addMembersMutation = useAddSubProjectMembers({
    subProjectId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Users added successfully');
        setSelectedUserIds(new Set());
        setPanel('view');
      },
      onError: () => {
        toast.error('Failed to add users. Please try again.');
      },
    },
  });

  // ── POST /manager/sub-projects/{subProjectId}/members/remove ────────────
  const removeMemberMutation = useRemovePaperMembers({
    subProjectId,
    mutationConfig: {
      onSuccess: () => toast.success('User removed successfully'),
      onError: () => toast.error('Failed to remove user. Please try again.'),
    },
  });

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate({ memberIds: [memberId] });
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAdd = () => {
    if (selectedUserIds.size === 0) return;
    addMembersMutation.mutate({
      members: Array.from(selectedUserIds).map((userId) => ({
        userId,
        groupName: addGroupName,
      })),
    });
  };

  const goBack = () => {
    setPanel('view');
    setSelectedUserIds(new Set());
    setSearchText('');
  };

  const handleClose = () => {
    setPanel('view');
    setSelectedUserIds(new Set());
    setSearchText('');
    onOpenChange(false);
  };

  const handleOpenAddPanel = () => {
    setPanel('add');
    void parentAuthorsQuery.refetch();
    void membersQuery.refetch();
  };

  const selectedCount = selectedUserIds.size;

  const panelTitle = {
    view: 'View Contributors',
    add: isManager ? 'Add Authors to Paper' : 'Add Contributor to Paper',
  }[panel];

  const addPanelDesc = isManager
    ? 'Select project authors to add'
    : 'Select project contributors to add';

  const panelDescription = {
    view: 'Contributors assigned to this paper',
    add: addPanelDesc,
  }[panel];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-sm">
        <SheetHeader className="px-1 pb-2">
          <div className="flex items-center gap-2">
            {panel === 'add' && (
              <button
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground mr-1 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Users className="h-5 w-5" />
            <SheetTitle>{panelTitle}</SheetTitle>
          </div>
          <SheetDescription className="truncate">
            {panelDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col gap-3 overflow-hidden px-1">
          {/* ── View panel: GET /projects/{id}/papers/{paperId}/members ── */}
          {panel === 'view' && (
            <div className="flex h-full flex-col">
              {canAddMembers && (
                <div className="mb-3 flex shrink-0 justify-end">
                  <Button
                    size="sm"
                    onClick={handleOpenAddPanel}
                    className={`gap-1.5 ${BTN.CREATE}`}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Contributor
                  </Button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-1">
                {membersQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : sortedMembers.length > 0 ? (
                  <ul className="space-y-2">
                    {sortedMembers.map((m) => (
                      <li
                        key={m.memberId}
                        className="border-border flex items-center gap-3 rounded-xl border px-4 py-3 transition-shadow hover:shadow-sm"
                      >
                        <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase">
                          {m.firstName?.[0] ?? m.username?.[0] ?? '?'}
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
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleColor(m.role)}`}
                        >
                          {formatRole(m.role)}
                        </span>
                        {isAuthor && m.role === PAPER_MEMBER_GROUP && (
                          <button
                            onClick={() => setMemberToRemove(m)}
                            disabled={removeMemberMutation.isPending}
                            className="text-muted-foreground hover:text-destructive ml-1 shrink-0 transition-colors disabled:opacity-50"
                            title="Remove contributor"
                          >
                            {removeMemberMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="bg-muted/30 rounded-xl py-12 text-center">
                    <Users className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                    <p className="text-muted-foreground text-sm">
                      No contributors assigned to this paper yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Add panel ─────────────────────────────────────────────── */}
          {panel === 'add' && (
            <>
              <div className="relative shrink-0">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  className="pl-10"
                />
              </div>

              {selectedCount > 0 && (
                <div className="flex shrink-0 items-center justify-between rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-950/30">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedCount} user{selectedCount !== 1 ? 's' : ''}{' '}
                    selected
                  </p>
                  <button
                    onClick={() => setSelectedUserIds(new Set())}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {parentAuthorsQuery.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </>
                ) : availableAuthors.length > 0 ? (
                  availableAuthors.map((author) => {
                    const isSelected = selectedUserIds.has(author.userId);
                    return (
                      <div
                        key={author.userId}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggleUser(author.userId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleUser(author.userId);
                          }
                        }}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50 shadow-sm dark:bg-blue-950/30'
                            : 'border-border hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm font-medium">
                            {author.firstName} {author.lastName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {author.email}
                            {author.username && ` · @${author.username}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-muted/30 rounded-xl py-10 text-center">
                    <p className="text-muted-foreground text-sm">
                      {searchText
                        ? `No ${isManager ? 'authors' : 'contributors'} found for "${searchText}"`
                        : `No available ${isManager ? 'authors' : 'contributors'} in this project`}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <SheetFooter className="mt-4 flex-col gap-2 px-1 sm:flex-col">
          {panel === 'view' && (
            <SheetClose asChild>
              <Button variant="outline" className={`w-full ${BTN.CANCEL}`}>
                Close
              </Button>
            </SheetClose>
          )}

          {panel === 'add' && (
            <div className="flex w-full gap-2">
              <Button
                onClick={handleAdd}
                disabled={selectedCount === 0 || addMembersMutation.isPending}
                className={`flex flex-1 items-center gap-2 ${BTN.CREATE}`}
              >
                {addMembersMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add ({selectedCount})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={goBack}
                disabled={addMembersMutation.isPending}
                className={BTN.CANCEL}
              >
                Cancel
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(o) => {
          if (!o) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contributor</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{' '}
              <span className="text-foreground font-semibold">
                {memberToRemove?.firstName} {memberToRemove?.lastName}
              </span>{' '}
              from this paper? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToRemove) handleRemoveMember(memberToRemove.memberId);
                setMemberToRemove(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
