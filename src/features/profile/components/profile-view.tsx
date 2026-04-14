import { Shield, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDetail } from '@/features/user-management/api/get-user';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useUser } from '@/lib/auth';
import { capitalize } from '@/utils/string-utils';

const fieldLabel = 'text-muted-foreground text-xs font-medium uppercase';

export const ProfileView = () => {
  const { data: authUser } = useUser();
  const userQuery = useUserDetail({
    userId: authUser?.id ?? '',
    queryConfig: { enabled: !!authUser?.id },
  });

  if (!authUser || userQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-64 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
    );
  }

  const user = userQuery.data?.result?.user;

  const displayName =
    [user?.firstName ?? authUser.firstName, user?.lastName ?? authUser.lastName]
      .filter(Boolean)
      .map((n) => capitalize(n!))
      .join(' ') ||
    authUser.preferredUsername ||
    '';

  const groups =
    user?.groups?.map((g) => g.name).filter((n): n is string => !!n) ??
    authUser.groups ??
    [];

  const isAdmin = groups.some((g) => g.includes('system:admin'));
  const primaryRole = isAdmin ? 'Administrator' : (groups[0] ?? 'Member');

  const archiveRef = authUser.id
    ? authUser.id.replace(/-/g, '').slice(-8).toUpperCase()
    : '——';

  const createdDate = user?.createdTimestamp
    ? new Date(user.createdTimestamp).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-1 font-serif text-5xl font-extrabold tracking-tight">
            {displayName || '—'}
          </h1>
        </div>
      </div>

      {/* Identity card */}
      <div className="bg-surface-container-low rounded-2xl border p-6">
        <div className="flex flex-wrap items-start gap-6">
          {/* Avatar */}
          <UserAvatar
            avatarUrl={user?.avatarUrl}
            firstName={authUser.firstName}
            username={authUser.preferredUsername}
            size="lg"
          />

          {/* Identity info */}
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-semibold">{displayName}</span>
              <Badge
                variant={user?.enabled !== false ? 'success' : 'destructive'}
              >
                {user?.enabled !== false ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{authUser.email}</p>
            {createdDate && (
              <p className={fieldLabel}>
                Joined:{' '}
                <span className="text-foreground font-medium normal-case">
                  {createdDate}
                </span>
              </p>
            )}
          </div>

          <div className="ml-auto text-right">
            <p className="text-foreground/10 font-sans text-5xl leading-none font-bold select-none">
              {archiveRef}
            </p>
          </div>
        </div>
      </div>

      {/* Info panels */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Account Information */}
        <div className="bg-surface-container-low space-y-5 rounded-2xl border p-6">
          <div className="flex items-start justify-between">
            <h2 className={fieldLabel}>Account Information</h2>
            <Shield className="text-muted-foreground size-4" />
          </div>

          <div className="space-y-4">
            <div>
              <p className={fieldLabel}>Role</p>
              <p className="mt-1 text-base font-medium">{primaryRole}</p>
            </div>
            <div>
              <p className={fieldLabel}>Username</p>
              <p className="mt-1 text-base font-medium">
                {user?.username ?? authUser.preferredUsername ?? '—'}
              </p>
            </div>
            <div>
              <p className={fieldLabel}>System ID</p>
              <p className="text-muted-foreground mt-1 font-sans text-xs break-all">
                {authUser.id}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-surface-container-low space-y-5 rounded-2xl border p-6">
          <div className="flex items-start justify-between">
            <h2 className={fieldLabel}>Personal Information</h2>
            <User className="text-muted-foreground size-4" />
          </div>

          <div className="space-y-4">
            <div>
              <p className={fieldLabel}>Email Address</p>
              <p className="mt-1 text-base font-medium">{authUser.email}</p>
            </div>
            <div>
              <p className={fieldLabel}>Email Verified</p>
              <div className="mt-1">
                <Badge variant={user?.emailVerified ? 'success' : 'outline'}>
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </div>
            <div>
              <p className={fieldLabel}>Groups</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {groups.length > 0 ? (
                  groups.map((g) => (
                    <Badge key={g} variant="muted">
                      {g}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
