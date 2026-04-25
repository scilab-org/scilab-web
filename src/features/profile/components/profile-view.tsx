import { Shield, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDetail } from '@/features/user-management/api/get-user';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useUser } from '@/lib/auth';
import { capitalize } from '@/utils/string-utils';
import { useUserAffiliations } from '@/features/user-affiliation-management/api/get-user-affiliations';

const fieldLabel = 'text-muted-foreground text-xs font-medium uppercase';

const formatYears = (
  affiliationStartYear: number | null,
  affiliationEndYear: number | null,
) => {
  const currentYear = new Date().getFullYear();

  if (affiliationStartYear === null && affiliationEndYear === null) {
    return '-';
  }

  if (affiliationStartYear === null) {
    return `${currentYear} - ${affiliationEndYear ?? currentYear}`;
  }

  if (affiliationEndYear === null) {
    return `${affiliationStartYear} - ${currentYear}`;
  }

  return `${affiliationStartYear} - ${affiliationEndYear}`;
};

export const ProfileView = () => {
  const { data: authUser } = useUser();
  const userQuery = useUserDetail({
    userId: authUser?.id ?? '',
    queryConfig: { enabled: !!authUser?.id },
  });
  const affiliationsQuery = useUserAffiliations({
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

  const userAffiliations = affiliationsQuery.data?.result ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-1 font-serif text-5xl font-extrabold tracking-tight">
            {displayName || '—'}
          </h1>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl border p-6">
        <div className="flex flex-wrap items-start gap-6">
          <UserAvatar
            avatarUrl={user?.avatarUrl}
            firstName={authUser.firstName}
            username={authUser.preferredUsername}
            size="lg"
          />

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

      <div className="grid gap-4 sm:grid-cols-2">
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
              <p className={fieldLabel}>OCR ID</p>
              <p className="mt-1 text-base font-medium">{user?.ocrId ?? '—'}</p>
            </div>
          </div>
        </div>

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
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl border p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className={fieldLabel}>Affiliations</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Institutions associated with this profile.
            </p>
          </div>
          <Badge variant="outline">{userAffiliations.length} total</Badge>
        </div>

        {affiliationsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : userAffiliations.length === 0 ? (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm">
              No affiliations available.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userAffiliations.map((item) => (
              <div
                key={item.id}
                className="bg-background/70 flex flex-wrap items-start justify-between gap-4 rounded-xl border px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {item.affiliation.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.department || 'N/A'} · {item.position || 'N/A'}
                  </p>
                  {item.affiliation.rorUrl && (
                    <a
                      href={item.affiliation.rorUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs underline-offset-2 hover:underline"
                    >
                      {item.affiliation.rorId || item.affiliation.rorUrl}
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <p className={fieldLabel}>Years</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatYears(
                      item.affiliationStartYear,
                      item.affiliationEndYear,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
