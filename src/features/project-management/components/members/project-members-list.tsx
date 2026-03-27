import { useState, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Loader2,
  Search,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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

import { BTN } from '@/lib/button-styles';
import { useProjectMembers } from '../../api/members/get-project-members';
import { useUpdateMemberRole } from '../../api/members/update-member-role';
import { ProjectMember } from '../../types';

const EXCLUDED_GROUPS = ['system:admin', 'project:project-manager'];

const isManagerRole = (role: string) =>
  role.toLowerCase().includes('manager') ||
  role.toLowerCase().includes('project:project-manager');

const getRolePriority = (role: string) => {
  const normalizedRole = role.toLowerCase();
  if (
    normalizedRole.includes('manager') ||
    normalizedRole.includes('project:project-manager')
  )
    return 0;
  if (
    normalizedRole.includes('author') ||
    normalizedRole.includes('project:author')
  )
    return 1;
  if (
    normalizedRole.includes('member') ||
    normalizedRole.includes('project:member')
  )
    return 2;
  return 3;
};

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

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-medium">
            {member.firstName || member.lastName
              ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
              : '—'}
          </div>
          {!member.enabled && (
            <span className="rounded-full border border-red-200 bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              Disabled
            </span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {member.email || '—'}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {member.username || '—'}
        </TableCell>
        <TableCell>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleColor(member.role)}`}
          >
            {member.role}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {member.joinedAt ? formatDate(member.joinedAt) : '—'}
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
        <SheetContent className="flex w-full flex-col sm:max-w-sm">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              Update Member Role
            </SheetTitle>
            <SheetDescription>
              Changing role for{' '}
              <span className="text-foreground font-semibold">
                {member.firstName || member.lastName
                  ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
                  : '—'}
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
              <Button variant="outline" className={`flex-1 ${BTN.CANCEL}`}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              className={`flex-1 ${BTN.EDIT}`}
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
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<
    string | null
  >(null);
  const [pendingRemoveType, setPendingRemoveType] = useState<
    'member' | 'manager' | null
  >(null);
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

  // Sort by role: manager -> author -> member
  const sortedMembers: ProjectMember[] = members
    ? [...members].sort((a: ProjectMember, b: ProjectMember) => {
        return getRolePriority(a.role) - getRolePriority(b.role);
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
                className={`${BTN.CREATE} flex items-center gap-2`}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Email
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Username
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Role
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Joined
                    </TableHead>
                    <TableHead className="text-right font-semibold text-green-900 dark:text-green-200">
                      Actions
                    </TableHead>
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
                      onRemove={(id) => {
                        setPendingRemoveMemberId(id);
                        setPendingRemoveType('member');
                      }}
                      onRemoveManager={(id) => {
                        setPendingRemoveMemberId(id);
                        setPendingRemoveType('manager');
                      }}
                      onUpdateRole={handleUpdateRole}
                      isRemoving={removingMemberId === member.memberId}
                      isRemovingManager={removingManagerId === member.memberId}
                      isUpdatingRole={updatingMemberId === member.memberId}
                      readOnly={readOnly}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {paging && paging.totalPages > 1 && (
              <div className="mt-6 grid grid-cols-3 items-center border-t px-4 pt-4 pb-4">
                <p className="text-muted-foreground text-sm">
                  Page{' '}
                  <span className="text-foreground font-medium">
                    {paging.pageNumber}
                  </span>{' '}
                  of{' '}
                  <span className="text-foreground font-medium">
                    {paging.totalPages}
                  </span>{' '}
                  &middot; {paging.totalCount} results
                </p>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!paging.hasPreviousPage}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {Array.from({ length: paging.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (paging.totalPages <= 7) return true;
                      if (p === 1 || p === paging.totalPages) return true;
                      if (Math.abs(p - paging.pageNumber) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="text-muted-foreground px-0.5 text-sm"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={
                            item === paging.pageNumber ? 'default' : 'outline'
                          }
                          size="icon"
                          className={`size-8 text-xs ${item === paging.pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </Button>
                      ),
                    )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!paging.hasNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>

                  <div className="ml-3 flex items-center gap-1.5 border-l pl-3">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      Go to
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={paging.totalPages}
                      defaultValue={paging.pageNumber}
                      className="h-8 w-14 text-center text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = Number(
                            (e.target as HTMLInputElement).value,
                          );
                          if (val >= 1 && val <= paging.totalPages) {
                            setPage(val);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div />
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

      <AlertDialog
        open={!!pendingRemoveMemberId}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoveMemberId(null);
            setPendingRemoveType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {pendingRemoveType === 'manager' ? 'Manager' : 'Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this{' '}
              {pendingRemoveType === 'manager' ? 'manager' : 'member'} from the
              project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingRemoveMemberId) {
                  if (pendingRemoveType === 'manager') {
                    (onRemoveManager ?? (() => {}))(pendingRemoveMemberId);
                  } else {
                    (onRemoveMember ?? (() => {}))(pendingRemoveMemberId);
                  }
                  setPendingRemoveMemberId(null);
                  setPendingRemoveType(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
