import { useState, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Loader2,
  Search,
  Users,
  ChevronDown,
  Pencil,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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

type MemberCardProps = {
  member: ProjectMember;
  availableGroups: Group[];
  viewerIsSystemAdmin: boolean;
  viewerIsProjectManager: boolean;
  onRemove: (memberId: string) => void;
  onUpdateRole: (memberId: string, groupName: string) => void;
  isRemoving?: boolean;
  isUpdatingRole?: boolean;
  readOnly?: boolean;
};

const MemberCard = ({
  member,
  availableGroups,
  viewerIsSystemAdmin,
  viewerIsProjectManager,
  onRemove,
  onUpdateRole,
  isRemoving,
  isUpdatingRole,
  readOnly = false,
}: MemberCardProps) => {
  const [editingRole, setEditingRole] = useState(false);
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
      setEditingRole(false);
      return;
    }
    onUpdateRole(member.memberId, newRole);
    setEditingRole(false);
  };

  const handleCancelEdit = () => {
    setNewRole(member.role);
    setEditingRole(false);
  };

  return (
    <div className="border-border rounded-lg border transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-foreground font-medium">
                {member.firstName} {member.lastName}
              </h4>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleColor(member.role)}`}
              >
                {member.role}
              </span>
              {!member.enabled && (
                <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Disabled
                </span>
              )}
            </div>
            <div className="mt-1 space-y-0.5">
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Email:</span> {member.email}
              </p>
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Username:</span> {member.username}
              </p>
              <p className="text-muted-foreground text-xs">
                <span className="font-medium">Joined:</span>{' '}
                {formatDate(member.joinedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* System admin: Remove only for manager members */}
        {!readOnly && viewerIsSystemAdmin && isManager && (
          <div className="flex shrink-0 items-center gap-2">
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
          </div>
        )}

        {/* Project manager viewer: Update Role + Remove for non-manager members */}
        {!readOnly &&
          !viewerIsSystemAdmin &&
          viewerIsProjectManager &&
          !isManager && (
            <div className="flex shrink-0 items-center gap-2">
              {editingRole ? (
                <>
                  <div className="relative">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="border-input bg-background text-foreground focus:ring-ring h-8 appearance-none rounded-md border py-0 pr-7 pl-3 text-sm shadow-sm focus:ring-2 focus:outline-none"
                    >
                      {availableGroups.map((group) => (
                        <option
                          key={group.id ?? group.name}
                          value={group.name ?? ''}
                        >
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2" />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveRole}
                    disabled={isUpdatingRole || !newRole}
                    className="h-8 px-3"
                  >
                    {isUpdatingRole ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isUpdatingRole}
                    className="h-8 px-3"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewRole(member.role);
                      setEditingRole(true);
                    }}
                    disabled={isRemoving}
                    className="flex items-center gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Update Role
                  </Button>
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
                </>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

type ProjectMembersListProps = {
  projectId: string;
  viewerIsProjectManager?: boolean;
  onAddMembersClick?: () => void;
  onRemoveMember?: (memberId: string) => void;
  removingMemberId?: string;
  readOnly?: boolean;
};

export const ProjectMembersList = ({
  projectId,
  viewerIsProjectManager = false,
  onAddMembersClick,
  onRemoveMember,
  removingMemberId,
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
    (g) => !EXCLUDED_GROUPS.includes(g.name ?? ''),
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

      <div className="p-6">
        {membersQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : members && members.length > 0 ? (
          <>
            <div className="space-y-3">
              {sortedMembers.map((member: ProjectMember) => (
                <MemberCard
                  key={member.memberId}
                  member={member}
                  availableGroups={availableGroups}
                  viewerIsSystemAdmin={viewerIsSystemAdmin}
                  viewerIsProjectManager={viewerIsProjectManager}
                  onRemove={onRemoveMember ?? (() => {})}
                  onUpdateRole={handleUpdateRole}
                  isRemoving={removingMemberId === member.memberId}
                  isUpdatingRole={updatingMemberId === member.memberId}
                  readOnly={readOnly}
                />
              ))}
            </div>

            {paging && paging.totalPages > 1 && (
              <div className="border-border mt-6 flex items-center justify-center gap-2 border-t pt-6">
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
