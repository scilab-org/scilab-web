import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

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

import { useGroups } from '../api/get-groups';
import { getGroupRolesQueryOptions } from '../api/get-group-roles';

export const GroupsList = () => {
  const queryClient = useQueryClient();
  const groupsQuery = useGroups();

  if (groupsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const groups = groupsQuery.data?.result;

  if (!groups || groups.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No groups found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Name
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Path
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group, index) => (
            <TableRow key={group.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <Link
                  to={paths.app.groupRoleManagement.group.getHref(group.id!)}
                  className="text-primary hover:underline"
                  onMouseEnter={() => {
                    queryClient.prefetchQuery(
                      getGroupRolesQueryOptions(group.id!),
                    );
                  }}
                >
                  {group.name}
                </Link>
              </TableCell>
              <TableCell>
                <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                  {group.path}
                </code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
