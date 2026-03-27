import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  UserPlus,
  Users,
  Check,
  ChevronDown,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getUserGroups, getUserRoles } from '@/lib/auth';
import { useGroups } from '@/features/group-role-management/api/get-groups';

import { BTN } from '@/lib/button-styles';
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
      className={`border-border rounded-lg border transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'hover:border-blue-300'
      }`}
    >
      {/* User row */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4"
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

      {/* Per-user group selector — only shown when selected in manager mode */}
      {isSelected && isManagerMode && (
        <div
          className="border-t border-blue-200 px-4 pb-3 dark:border-blue-800/50"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <label
            htmlFor={`role-select-${user.id}`}
            className="text-muted-foreground mb-1 block text-xs font-medium"
          >
            Assign role
          </label>
          <div className="relative">
            <select
              id={`role-select-${user.id}`}
              value={assignedGroup}
              onChange={(e) => onChangeGroup(user.id, e.target.value)}
              className="border-input bg-background text-foreground focus:ring-ring w-full appearance-none rounded-md border px-3 py-1.5 pr-8 text-sm shadow-sm focus:ring-2 focus:outline-none"
            >
              <option value="" disabled>
                Select a role...
              </option>
              {availableGroups.map((group) => (
                <option key={group.id ?? group.name} value={group.name ?? ''}>
                  {group.name}
                </option>
              ))}
            </select>
            <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2" />
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
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleReset();
        onOpenChange(o);
      }}
    >
      <SheetContent className="flex flex-col sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <UserCog className="h-5 w-5" />
            )}
            <SheetTitle>{isAdmin ? 'Add Managers' : 'Add Members'}</SheetTitle>
          </div>
          <SheetDescription>
            {isAdmin
              ? 'Select users to add as project managers.'
              : 'Select users and assign a role to each one.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
          {/* Search bar */}
          <div className="relative">
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
            <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
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
          <div className="max-h-95 space-y-2 overflow-y-auto pr-1">
            {usersQuery.isLoading ? (
              <>
                <Skeleton className="h-15 w-full" />
                <Skeleton className="h-15 w-full" />
                <Skeleton className="h-15 w-full" />
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
              <div className="bg-muted/30 rounded-lg py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No users found for &ldquo;{searchDebounce}&rdquo;
                </p>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg py-8 text-center">
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

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button
              variant="outline"
              disabled={isPending}
              className={BTN.CANCEL}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className={`gap-2 ${BTN.CREATE}`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {isAdmin ? 'Add Managers' : 'Add Members'} ({selectedCount})
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
