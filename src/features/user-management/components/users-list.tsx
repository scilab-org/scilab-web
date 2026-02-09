import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

import { useUsers } from '../api/get-users';
import { getUserQueryOptions } from '../api/get-user';
import { DeactivateUser } from './deactivate-user';

export const UsersList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const page = +(searchParams.get('page') || 1);
  const searchText = searchParams.get('search') || undefined;

  const usersQuery = useUsers({
    params: { pageNumber: page, searchText },
  });

  if (usersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const users = usersQuery.data?.result?.items;
  const paging = usersQuery.data?.result?.paging;

  if (!users || users.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No users found.</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Groups</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <Link
                  to={paths.app.userManagement.user.getHref(user.id!)}
                  className="text-primary hover:underline"
                  onMouseEnter={() => {
                    queryClient.prefetchQuery(getUserQueryOptions(user.id!));
                  }}
                >
                  {user.username}
                </Link>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>
                <Badge variant={user.enabled ? 'default' : 'destructive'}>
                  {user.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.groups?.map((g) => (
                    <Badge key={g.id} variant="outline">
                      {g.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="xs" asChild>
                    <Link to={paths.app.userManagement.user.getHref(user.id!)}>
                      View
                    </Link>
                  </Button>
                  {user.enabled && <DeactivateUser userId={user.id!} />}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paging && paging.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {paging.pageNumber} of {paging.totalPages} ({paging.totalCount}{' '}
            total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!paging.hasPreviousPage}
              asChild={paging.hasPreviousPage}
            >
              {paging.hasPreviousPage ? (
                <Link
                  to={`?page=${paging.pageNumber - 1}${searchText ? `&search=${searchText}` : ''}`}
                >
                  Previous
                </Link>
              ) : (
                'Previous'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!paging.hasNextPage}
              asChild={paging.hasNextPage}
            >
              {paging.hasNextPage ? (
                <Link
                  to={`?page=${paging.pageNumber + 1}${searchText ? `&search=${searchText}` : ''}`}
                >
                  Next
                </Link>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
