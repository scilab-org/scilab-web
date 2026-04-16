import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import { StatusDot } from '@/components/ui/status-dot';

import { useUsers } from '../api/get-users';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getUserQueryOptions } from '../api/get-user';
import { UpdateUser } from './update-user';
import { DeactivateUser } from './deactivate-user';
import { ActivateUser } from './activate-user';
import { capitalize } from '@/utils/string-utils';
import { GROUPS } from '@/lib/authorization';
import { Pagination } from '@/components/ui/pagination';

export const UsersList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const page = +(searchParams.get('page') || 1);
  const searchText = searchParams.get('search') || undefined;
  const groupName = searchParams.get('groupName') || undefined;
  const enabled = searchParams.get('enabled') || undefined;

  const usersQuery = useUsers({
    params: { pageNumber: page, pageSize: 10, searchText, groupName, enabled },
  });

  if (usersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const users = usersQuery.data?.result?.items;
  const paging = usersQuery.data?.result?.paging;

  if (!users || users.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {searchText || groupName || enabled
            ? 'No users match your search criteria.'
            : 'No users found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isAdmin = user.groups?.some(
              (g) => g.name === GROUPS.SYSTEM_ADMIN,
            );
            return (
              <TableRow key={user.id} className="border-0">
                {/* Username + avatar */}
                <TableCell>
                  <Link
                    to={paths.app.userManagement.user.getHref(user.id!)}
                    className="flex items-center gap-3 underline-offset-2 hover:underline"
                    onMouseEnter={() => {
                      queryClient.prefetchQuery(getUserQueryOptions(user.id!));
                    }}
                  >
                    <UserAvatar
                      avatarUrl={user.avatarUrl}
                      firstName={user.firstName}
                      username={user.username}
                      size="sm"
                    />
                    <span className="text-foreground text-base font-semibold">
                      {user.username}
                    </span>
                  </Link>
                </TableCell>

                {/* Email */}
                <TableCell className="text-muted-foreground text-sm">
                  {user.email}
                </TableCell>

                {/* Name */}
                <TableCell className="text-foreground text-sm">
                  {capitalize(user.firstName)} {capitalize(user.lastName)}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusDot variant={user.enabled ? 'active' : 'disabled'} />
                </TableCell>

                {/* Role — subtle badge */}
                <TableCell>
                  <Badge variant={isAdmin ? 'admin' : 'user'}>
                    {isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <UpdateUser user={user} userId={user.id!} />
                    {user.enabled ? (
                      <DeactivateUser userId={user.id!} />
                    ) : (
                      <ActivateUser userId={user.id!} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {paging && <Pagination paging={paging} />}
    </div>
  );
};
