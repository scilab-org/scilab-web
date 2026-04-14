import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  Users,
  Check,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getUserGroups, getUserRoles } from '@/lib/auth';
import { useGroups } from '@/features/group-role-management/api/get-groups';

import { useAvailableUsers } from '../../api/members/get-available-users';
import { useAddManagers } from '../../api/members/add-project-manager';
import { useAddProjectMembers } from '../../api/members/add-project-members';
import { AvailableUser } from '../../types';

const ADMIN_GROUP = 'system:admin';
const MANAGER_GROUP = 'project:project-manager';
const EXCLUDED_GROUPS = [ADMIN_GROUP, MANAGER_GROUP];

const detectRole = (currentUserProjectRole?: string) => {
  if (currentUserProjectRole) {
    const r = currentUserProjectRole.toLowerCase();
    if (r.includes('admin')) return { isAdmin: true, isManager: false };
    if (r.includes('manager')) return { isAdmin: false, isManager: true };
  }

  const groups = getUserGroups();
  const roles = getUserRoles();

  const isAdmin =
    groups.includes(ADMIN_GROUP) ||
    roles.some((r) =>
      ['realm-admin', 'admin', 'system-admin'].includes(r.toLowerCase()),
    );

  const isManager =
    groups.includes(MANAGER_GROUP) ||
    roles.some((r) =>
      ['project-manager', 'project:project-manager'].includes(r.toLowerCase()),
    );

  return { isAdmin, isManager: isManager || !isAdmin };
};

const formatGroupLabel = (name: string) => {
  const stripped = name.replace(/^project:/i, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
};

const getRoleColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('author'))
    return {
      active: 'border-blue-500 bg-blue-500 text-white shadow-sm',
      idle: 'border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-blue-600',
    };
  if (n.includes('member'))
    return {
      active: 'border-green-500 bg-green-500 text-white shadow-sm',
      idle: 'border-border bg-background text-muted-foreground hover:border-green-300 hover:text-green-600',
    };
  return {
    active: 'border-primary bg-primary text-primary-foreground shadow-sm',
    idle: 'border-border bg-background text-muted-foreground hover:border-primary/50',
  };
};

type Group = { id?: string | null; name?: string | null };

type UserCardProps = {
  user: AvailableUser;
  isSelected: boolean;
  assignedGroup: string;
  availableGroups: Group[];
  isManagerMode: boolean;
  onToggleSelect: (userId: string) => void;
  onChangeGroup: (userId: string, groupName: string) => void;
};

const UserCard = ({
  user,
  isSelected,
  assignedGroup,
  availableGroups,
  isManagerMode,
  onToggleSelect,
  onChangeGroup,
}: UserCardProps) => {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-sm dark:bg-blue-950/30'
          : 'border-border hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {/* User row */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onClick={() => onToggleSelect(user.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleSelect(user.id);
          }
        }}
        role="button"
        tabIndex={0}
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
          <div className="flex items-center gap-2">
            <p className="text-foreground truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            {!user.enabled && (
              <span className="shrink-0 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                Disabled
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {user.email}
            {user.username && user.username !== user.email && (
              <> &middot; @{user.username}</>
            )}
          </p>
        </div>
      </div>

      {/* Per-user role pill selector — shown when selected in manager mode */}
      {isSelected && isManagerMode && (
        <div
          className="border-t border-blue-200 px-4 pt-2 pb-3 dark:border-blue-800/50"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            Assign role
          </p>
          <div className="flex flex-wrap gap-2">
            {availableGroups.map((group) => {
              const rawName = group.name ?? '';
              const label = formatGroupLabel(rawName);
              const isActive = assignedGroup === rawName;
              const colors = getRoleColor(rawName);
              return (
                <button
                  key={group.id ?? rawName}
                  type="button"
                  onClick={() => onChangeGroup(user.id, rawName)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                    isActive ? colors.active : colors.idle
                  }`}
                >
                  {isActive && <Check className="h-3 w-3 shrink-0" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

type AddMembersModalProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Role of the currently logged-in user in this specific project */
  currentUserProjectRole?: string;
};

export const AddMembersModal = ({
  projectId,
  open,
  onOpenChange,
  currentUserProjectRole,
}: AddMembersModalProps) => {
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  // Manager mode: userId -> groupName
  const [userGroupMap, setUserGroupMap] = useState<Record<string, string>>({});
  // Admin mode: only 1 user allowed
  const [selectedAdminUser, setSelectedAdminUser] = useState<string | null>(
    null,
  );

  const { isAdmin, isManager } = detectRole(currentUserProjectRole);

  const groupsQuery = useGroups({
    queryConfig: { enabled: open && !isAdmin },
  });

  const availableGroups = (groupsQuery.data?.result || []).filter(
    (g) =>
      !EXCLUDED_GROUPS.includes(g.name ?? '') &&
      (g.name ?? '').startsWith('project:'),
  );

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDebounce(searchText), 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const usersQuery = useAvailableUsers({
    projectId,
    params: {
      searchText: searchDebounce || undefined,
      adminGroupName: ADMIN_GROUP,
    },
    queryConfig: { enabled: open },
  });

  const addManagersMutation = useAddManagers({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Managers added successfully');
        handleReset();
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to add managers. Please try again.');
      },
    },
  });

  const addMembersMutation = useAddProjectMembers({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Members added successfully');
        handleReset();
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to add members. Please try again.');
      },
    },
  });

  const isPending =
    addManagersMutation.isPending || addMembersMutation.isPending;

  const handleToggleUser = (userId: string) => {
    if (isAdmin) {
      setSelectedAdminUser((prev) => (prev === userId ? null : userId));
    } else {
      setUserGroupMap((prev) => {
        const next = { ...prev };
        if (userId in next) {
          delete next[userId];
        } else {
          next[userId] = availableGroups[0]?.name ?? '';
        }
        return next;
      });
    }
  };

  const handleChangeGroup = (userId: string, groupName: string) => {
    setUserGroupMap((prev) => ({ ...prev, [userId]: groupName }));
  };

  const handleSubmit = () => {
    if (isAdmin) {
      if (!selectedAdminUser) return;
      addManagersMutation.mutate({ userId: selectedAdminUser });
    } else {
      const entries = Object.entries(userGroupMap);
      if (entries.length === 0) return;
      const missing = entries.filter(([, g]) => !g);
      if (missing.length > 0) {
        toast.error('Please assign a role to all selected members.');
        return;
      }
      addMembersMutation.mutate({
        members: entries.map(([userId, groupName]) => ({ userId, groupName })),
      });
    }
  };

  const handleReset = () => {
    setUserGroupMap({});
    setSelectedAdminUser(null);
    setSearchText('');
  };

  const users = (usersQuery.data as any)?.result?.items || [];
  const selectedCount = isAdmin
    ? selectedAdminUser
      ? 1
      : 0
    : Object.keys(userGroupMap).length;
  const canSubmit = isAdmin
    ? selectedAdminUser !== null
    : Object.keys(userGroupMap).length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleReset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <UserCog className="h-5 w-5" />
              )}
              <DialogTitle>
                {isAdmin ? 'Add Managers' : 'Add Members'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {isAdmin
                ? 'Select users to add as project managers.'
                : 'Select users and assign a role to each one.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="scrollbar-dialog flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search users by email, name, or username..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-10"
            />
          </div>

          {/* Selection summary */}
          {selectedCount > 0 && (
            <div className="flex shrink-0 items-center justify-between rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={() => {
                  setUserGroupMap({});
                  setSelectedAdminUser(null);
                }}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear
              </button>
            </div>
          )}

          {/* Users list */}
          <div className="flex-1 space-y-2">
            {usersQuery.isLoading ? (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            ) : users.length > 0 ? (
              users.map((user: AvailableUser) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isSelected={
                    isAdmin
                      ? selectedAdminUser === user.id
                      : user.id in userGroupMap
                  }
                  assignedGroup={userGroupMap[user.id] ?? ''}
                  availableGroups={availableGroups}
                  isManagerMode={isManager && !isAdmin}
                  onToggleSelect={handleToggleUser}
                  onChangeGroup={handleChangeGroup}
                />
              ))
            ) : searchDebounce ? (
              <div className="bg-muted/30 rounded-xl py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  No users found for &ldquo;{searchDebounce}&rdquo;
                </p>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-xl py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  Start typing to search for available users
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Search by email, name, or username
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="ghost"
                disabled={isPending}
                className="uppercase"
              >
                CANCEL
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              variant="darkRed"
              className="uppercase"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ADDING...
                </>
              ) : (
                `ADD (${selectedCount})`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
