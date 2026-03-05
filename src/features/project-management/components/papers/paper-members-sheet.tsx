import { useState } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  Search,
  Check,
  ArrowLeft,
  Eye,
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

import { usePaperMembers } from '../../api/papers/get-paper-members';
import { usePaperMembersAvailable } from '../../api/papers/get-paper-members-available';
import { useAddSubProjectMembers } from '../../api/papers/add-sub-project-members';
import { useRemovePaperMembers } from '../../api/papers/remove-paper-members';
import { ProjectMember } from '../../types';

const AUTHOR_ROLE = 'project:author';
const MEMBER_ROLE = 'project:member';

type Panel = 'default' | 'view' | 'add';

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
  paperTitle,
  open,
  onOpenChange,
}: PaperMembersSheetProps) => {
  // Manager adds authors; author adds members
  const canAddMembers = isManager || isAuthor;
  const addRoleFilter = isManager ? AUTHOR_ROLE : MEMBER_ROLE;
  const addGroupName = isManager ? AUTHOR_ROLE : MEMBER_ROLE;
  const [panel, setPanel] = useState<Panel>('default');
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
  const members: ProjectMember[] =
    (membersQuery.data as any)?.result?.items ?? [];

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
        toast.success('Members added successfully');
        setSelectedUserIds(new Set());
        setPanel('default');
      },
      onError: () => {
        toast.error('Failed to add members. Please try again.');
      },
    },
  });

  // ── POST /manager/sub-projects/{subProjectId}/members/remove ────────────
  const removeMemberMutation = useRemovePaperMembers({
    subProjectId,
    mutationConfig: {
      onSuccess: () => toast.success('Member removed successfully'),
      onError: () => toast.error('Failed to remove member. Please try again.'),
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
    setPanel('default');
    setSelectedUserIds(new Set());
    setSearchText('');
  };

  const handleClose = () => {
    setPanel('default');
    setSelectedUserIds(new Set());
    setSearchText('');
    onOpenChange(false);
  };

  const selectedCount = selectedUserIds.size;

  const panelTitle = {
    default: 'Paper Members',
    view: 'View Members',
    add: 'Add Authors to Paper',
  }[panel];

  const addPanelDesc = isManager
    ? `Select project authors to add to "${paperTitle}"`
    : `Select project members to add to "${paperTitle}"`;

  const panelDescription = {
    default: `"${paperTitle}"`,
    view: `Members assigned to "${paperTitle}"`,
    add: addPanelDesc,
  }[panel];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <SheetContent className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {panel !== 'default' && (
              <button
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground mr-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {panel === 'default' && <Users className="h-5 w-5" />}
            <SheetTitle>{panelTitle}</SheetTitle>
          </div>
          <SheetDescription className="truncate">
            {panelDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
          {/* ── Default panel: action buttons ──────────────────────────── */}
          {panel === 'default' && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPanel('view')}
                className="border-border hover:border-primary/50 hover:bg-muted/40 flex items-center gap-4 rounded-lg border px-5 py-4 text-left transition-all"
              >
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Eye className="text-muted-foreground h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    View Members
                  </p>
                  <p className="text-muted-foreground text-xs">
                    See who is currently assigned to this paper
                  </p>
                </div>
              </button>

              {canAddMembers && (
                <button
                  onClick={() => setPanel('add')}
                  className="border-border hover:border-primary/50 hover:bg-muted/40 flex items-center gap-4 rounded-lg border px-5 py-4 text-left transition-all"
                >
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <UserPlus className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      Add Members
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {isManager
                        ? 'Add project authors to this paper'
                        : 'Add project members to this paper'}
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* ── View panel: GET /projects/{id}/papers/{paperId}/members ── */}
          {panel === 'view' && (
            <>
              {membersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : members.length > 0 ? (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.memberId}
                      className="border-border flex items-center gap-3 rounded-lg border px-4 py-3"
                    >
                      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase">
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
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleColor(m.role)}`}
                      >
                        {m.role}
                      </span>
                      {((isManager && m.role === AUTHOR_ROLE) ||
                        (isAuthor && m.role === MEMBER_ROLE)) && (
                        <button
                          onClick={() => setMemberToRemove(m)}
                          disabled={removeMemberMutation.isPending}
                          className="text-muted-foreground hover:text-destructive ml-1 shrink-0 transition-colors disabled:opacity-50"
                          title="Remove member"
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
                <div className="bg-muted/30 rounded-lg py-12 text-center">
                  <Users className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-sm">
                    No members assigned to this paper yet
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Add panel: GET /projects/{id}/members (old API) ─────────── */}
          {panel === 'add' && (
            <>
              <div className="relative">
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
                <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
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

              <div className="max-h-100 space-y-2 overflow-y-auto pr-1">
                {parentAuthorsQuery.isLoading ? (
                  <>
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
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
                        className={`border-border flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all hover:shadow-sm ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'hover:border-blue-300'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
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
                  <div className="bg-muted/30 rounded-lg py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      {searchText
                        ? `No authors found for "${searchText}"`
                        : 'No available authors in this project'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
          {panel === 'default' && (
            <SheetClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </SheetClose>
          )}

          {panel === 'view' && (
            <Button variant="outline" onClick={goBack} className="w-full">
              Back
            </Button>
          )}

          {panel === 'add' && (
            <div className="flex w-full gap-2">
              <Button
                onClick={handleAdd}
                disabled={selectedCount === 0 || addMembersMutation.isPending}
                className="flex flex-1 items-center gap-2"
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
            <AlertDialogTitle>Remove member</AlertDialogTitle>
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
