import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useUserDetail } from '../api/get-user';
import { UpdateUser } from './update-user';
import { DeactivateUser } from './deactivate-user';
import { ActivateUser } from './activate-user';

export const UserView = ({ userId }: { userId: string }) => {
  const userQuery = useUserDetail({ userId });

  if (userQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const user = userQuery.data?.result?.user;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <span className="border-border relative inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-200 dark:bg-slate-700">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username ?? ''}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-slate-600 select-none dark:text-slate-300">
                {(
                  user.firstName?.[0] ??
                  user.username?.[0] ??
                  '?'
                ).toUpperCase()}
              </span>
            )}
          </span>

          <div className="flex flex-col gap-1.5">
            <Badge variant={user.enabled ? 'default' : 'destructive'}>
              {user.enabled ? 'Active' : 'Disabled'}
            </Badge>
            {user.emailVerified && (
              <Badge variant="outline">Email Verified</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <UpdateUser userId={userId} user={user} />
          {user.enabled ? (
            <DeactivateUser userId={userId} />
          ) : (
            <ActivateUser userId={userId} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Basic user account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Created</p>
              <p className="font-medium">
                {user.createdTimestamp
                  ? new Date(user.createdTimestamp).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>User name and profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">First Name</p>
              <p className="font-medium">{user.firstName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last Name</p>
              <p className="font-medium">{user.lastName || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {user.groups && user.groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Groups this user belongs to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.groups.map((group) => (
                <Badge key={group.id} variant="secondary">
                  {group.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
