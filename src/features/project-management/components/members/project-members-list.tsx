import { useState, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Loader2,
  Search,
  ShieldCheck,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useGroups } from '@/features/group-role-management/api/get-groups';
import { getUserGroups } from '@/lib/auth';

import { useProjectMembers } from '../../api/members/get-project-members';
import { useUpdateMemberRole } from '../../api/members/update-member-role';
import { ProjectMember } from '../../types';

const EXCLUDED_GROUPS = ['system:admin', 'project:project-manager'];

const isManagerRole = (role: string) =>
  role.toLowerCase().includes('manager') ||
  role.toLowerCase().includes('project:project-manager');

type Group = { id?: string | null; name?: string | null };

type MemberTableRowProps = {
  member: ProjectMember;
  availableGroups: Group[];
  viewerIsSystemAdmin: boolean;
  viewerIsProjectManager: boolean;
  onRemove: (memberId: string) => void;
  onRemoveManager: (memberId: string) => void;
  onUpdateRole: (memberId: string, groupName: string) => void;
  isRemoving?: boolean;
  isRemovingManager?: boolean;
  isUpdatingRole?: boolean;
  readOnly?: boolean;
};

const MemberTableRow = ({
  member,
  availableGroups,
  viewerIsSystemAdmin,
  viewerIsProjectManager,
  onRemove,
  onRemoveManager,
  onUpdateRole,
  isRemoving,
  isRemovingManager,
  isUpdatingRole,
  readOnly = false,
}: MemberTableRowProps) => {
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [newRole, setNewRole] = useState(member.role);

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('author'))
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    if (r.includes('admin'))
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    if (r.includes('manager'))
      return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
    if (r.includes('member'))
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));

  const isManager = isManagerRole(member.role);

  const handleSaveRole = () => {
    if (!newRole || newRole === member.role) {
      setRoleSheetOpen(false);
      return;
    }
    onUpdateRole(member.memberId, newRole);
    setRoleSheetOpen(false);
  };

  const handleOpenRoleSheet = () => {
    setNewRole(member.role);
    setRoleSheetOpen(true);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-medium">
            {member.firstName} {member.lastName}
          </div>
          {!member.enabled && (
            <span className="rounded-full border border-red-200 bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              Disabled
            </span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {member.email}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {member.username}
        </TableCell>
        <TableCell>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleColor(member.role)}`}
          >
            {member.role}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {formatDate(member.joinedAt)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {/* System admin: Remove only for manager members */}
            {!readOnly && viewerIsSystemAdmin && isManager && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveManager(member.memberId)}
                disabled={isRemovingManager}
                className="flex items-center gap-1.5"
              >
                {isRemovingManager ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            )}

            {/* Project manager: Remove for non-manager members */}
            {!readOnly &&
              !viewerIsSystemAdmin &&
              viewerIsProjectManager &&
              !isManager && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemove(member.memberId)}
                  disabled={isRemoving}
                  className="flex items-center gap-1.5"
                >
                  {isRemoving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Remove
                </Button>
              )}
          </div>
        </TableCell>
      </TableRow>

      {/* Update Role Sheet */}
      <Sheet open={roleSheetOpen} onOpenChange={setRoleSheetOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              Update Member Role
            </SheetTitle>
            <SheetDescription>
              Changing role for{' '}
              <span className="text-foreground font-semibold">
                {member.firstName} {member.lastName}
              </span>
            </SheetDescription>
          </SheetHeader>

          {/* Current role */}
          <div className="border-border bg-muted/30 mt-6 rounded-lg border p-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              Current Role
            </p>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleColor(member.role)}`}
            >
              {member.role}
            </span>
          </div>

          {/* Role options */}
          <div className="mt-6 flex-1 space-y-2">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Select New Role
            </p>
            {availableGroups.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No roles available
              </div>
            ) : (
              availableGroups.map((group) => {
                const name = group.name ?? '';
                const isSelected = newRole === name;
                return (
                  <button
                    key={group.id ?? name}
                    type="button"
                    onClick={() => setNewRole(name)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-foreground font-medium shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/40'
                    }`}
                  >
                    <span>{name}</span>
                    {isSelected && (
                      <Check className="text-primary h-4 w-4 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <SheetFooter className="mt-6 flex gap-2 sm:flex-row">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </SheetClose>
            <Button
              className="flex-1"
              onClick={handleSaveRole}
              disabled={isUpdatingRole || !newRole || newRole === member.role}
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

type ProjectMembersListProps = {
  projectId: string;
  viewerIsProjectManager?: boolean;
  onAddMembersClick?: () => void;
  onAddManagersClick?: () => void;
  onRemoveMember?: (memberId: string) => void;
  onRemoveManager?: (memberId: string) => void;
  removingMemberId?: string;
  removingManagerId?: string;
  readOnly?: boolean;
};

export const ProjectMembersList = ({
  projectId,
  viewerIsProjectManager = false,
  onAddMembersClick,
  onAddManagersClick,
  onRemoveMember,
  onRemoveManager,
  removingMemberId,
  removingManagerId,
  readOnly = false,
}: ProjectMembersListProps) => {
  // Detect role from JWT groups directly — reliable regardless of project membership
  const viewerIsSystemAdmin = getUserGroups().includes('system:admin');
  const [page, setPage] = useState(1);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState<
    string | undefined
  >();
  const pageSize = 20;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounce(searchEmail);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchEmail]);

  const membersQuery = useProjectMembers({
    projectId,
    params: {
      searchEmail: searchDebounce || undefined,
      pageNumber: page,
      pageSize,
    },
  });

  const groupsQuery = useGroups({
    queryConfig: { enabled: viewerIsProjectManager && !viewerIsSystemAdmin },
  });
  const availableGroups = (groupsQuery.data?.result || []).filter(
    (g) =>
      !EXCLUDED_GROUPS.includes(g.name ?? '') &&
      (g.name ?? '').startsWith('project:'),
  );

  const updateRoleMutation = useUpdateMemberRole({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        setUpdatingMemberId(undefined);
        toast.success('Role updated successfully');
      },
      onError: () => {
        setUpdatingMemberId(undefined);
        toast.error('Failed to update role. Please try again.');
      },
    },
  });

  const handleUpdateRole = (memberId: string, groupName: string) => {
    setUpdatingMemberId(memberId);
    updateRoleMutation.mutate({ memberId, groupName });
  };

  if (membersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const members = (membersQuery.data as any)?.result?.items;
  const paging = (membersQuery.data as any)?.result?.paging;

  // Sort: managers appear first
  const sortedMembers: ProjectMember[] = members
    ? [...members].sort((a: ProjectMember, b: ProjectMember) => {
        const aIsManager = isManagerRole(a.role);
        const bIsManager = isManagerRole(b.role);
        if (aIsManager && !bIsManager) return -1;
        if (!aIsManager && bIsManager) return 1;
        return 0;
      })
    : [];

  return (
    <div className="border-border rounded-xl border shadow-sm">
      <div className="border-border bg-muted/30 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              Project Members
            </h2>
            {paging && (
              <p className="text-muted-foreground mt-1 text-sm">
                {paging.totalCount} member
                {paging.totalCount !== 1 ? 's' : ''} in this project
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {viewerIsSystemAdmin && !!onAddManagersClick && (
              <Button
                onClick={onAddManagersClick}
                size="sm"
                className="flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700"
              >
                <UserPlus className="h-4 w-4" />
                Add Manager
              </Button>
            )}
            {!readOnly && !!onAddMembersClick && (
              <Button
                onClick={onAddMembersClick}
                size="sm"
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                Add Members
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        {membersQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : members && members.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((member: ProjectMember) => (
                  <MemberTableRow
                    key={member.memberId}
                    member={member}
                    availableGroups={availableGroups}
                    viewerIsSystemAdmin={viewerIsSystemAdmin}
                    viewerIsProjectManager={viewerIsProjectManager}
                    onRemove={onRemoveMember ?? (() => {})}
                    onRemoveManager={onRemoveManager ?? (() => {})}
                    onUpdateRole={handleUpdateRole}
                    isRemoving={removingMemberId === member.memberId}
                    isRemovingManager={removingManagerId === member.memberId}
                    isUpdatingRole={updatingMemberId === member.memberId}
                    readOnly={readOnly}
                  />
                ))}
              </TableBody>
            </Table>

            {paging && paging.totalPages > 1 && (
              <div className="border-border mt-4 flex items-center justify-center gap-2 border-t px-6 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={!paging.hasPreviousPage}
                >
                  Previous
                </Button>
                <div className="bg-muted text-muted-foreground flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium">
                  {paging.pageNumber} / {paging.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!paging.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : searchDebounce ? (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No members found for &ldquo;{searchDebounce}&rdquo;
            </p>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No members added yet
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Add members to start collaborating
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
