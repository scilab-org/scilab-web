import { useEffect, useState } from 'react';
import { Users, Loader2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

import { useUser } from '@/lib/auth';
import { usePaperMembersAvailable } from '../../api/papers/get-paper-members-available';
import { useAddSubProjectMembers } from '../../api/papers/add-sub-project-members';
import { ProjectMember } from '../../types';

const AUTHOR_ROLE = 'project:author';
const PROJECT_MEMBER_ROLE = 'project:member';
const PAPER_AUTHOR_GROUP = 'paper:author';
const PAPER_MEMBER_GROUP = 'paper:member';

type PaperMembersDialogProps = {
  /** Sub-project ID */
  subProjectId: string;
  isManager: boolean;
  isAuthor: boolean;
  paperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PaperMembersDialog = ({
  subProjectId,
  isManager,
  isAuthor: _isAuthor,
  paperTitle: _paperTitle,
  open,
  onOpenChange,
}: PaperMembersDialogProps) => {
  const { data: user } = useUser();
  const isSystemAdmin = user?.groups?.includes('system:admin') ?? false;

  const addRoleFilter = isManager ? AUTHOR_ROLE : PROJECT_MEMBER_ROLE;
  const addGroupName = isManager ? PAPER_AUTHOR_GROUP : PAPER_MEMBER_GROUP;
  const [searchText, setSearchText] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchText('');
      setSelectedUserIds(new Set());
    }
  }, [open]);

  // ── GET /sub-projects/{subProjectId}/members/available ───────────────────
  // Manager → shows project:author; Author → shows project:member
  const parentAuthorsQuery = usePaperMembersAvailable({
    subProjectId,
    params: { projectRole: addRoleFilter, pageSize: 1000 },
    queryConfig: { enabled: open },
  });
  const parentAuthors: ProjectMember[] =
    (parentAuthorsQuery.data as any)?.result?.items ?? [];

  const availableAuthors = parentAuthors.filter((a) => {
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
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to add users. Please try again.');
      },
    },
  });

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

  const handleClose = () => {
    setSelectedUserIds(new Set());
    setSearchText('');
    onOpenChange(false);
  };

  const selectedCount = selectedUserIds.size;

  const canAddMembers = (isManager || _isAuthor) && !isSystemAdmin;

  const dialogTitle = isManager
    ? 'Add Authors to Paper'
    : 'Add Contributor to Paper';
  const dialogDesc = isManager
    ? 'Select project authors to add'
    : 'Select project contributors to add';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-full flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <DialogTitle>{dialogTitle}</DialogTitle>
            </div>
            <DialogDescription className="truncate">
              {dialogDesc}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="scrollbar-dialog flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {canAddMembers ? (
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

              <div className="flex-1 space-y-2">
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
          ) : (
            <div className="bg-muted/30 rounded-xl py-10 text-center">
              <p className="text-muted-foreground text-sm">
                You do not have permission to add contributors.
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter className="gap-2 sm:gap-0">
            <div className="flex w-full gap-2">
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={addMembersMutation.isPending}
                className="flex-1 uppercase"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  selectedCount === 0 ||
                  addMembersMutation.isPending ||
                  !canAddMembers
                }
                variant="darkRed"
                className="flex-1 uppercase"
              >
                {addMembersMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ADDING...
                  </>
                ) : (
                  `ADD (${selectedCount})`
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
