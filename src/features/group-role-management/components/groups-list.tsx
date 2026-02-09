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

import { useGroups } from '../api/get-groups';
import { getGroupRolesQueryOptions } from '../api/get-group-roles';
import { GroupDto } from '../types';

const flattenGroups = (groups: GroupDto[]): GroupDto[] => {
  const result: GroupDto[] = [];
  for (const group of groups) {
    result.push(group);
    if (group.subGroups && group.subGroups.length > 0) {
      result.push(...flattenGroups(group.subGroups));
    }
  }
  return result;
};

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

  const flatGroups = flattenGroups(groups);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Sub Groups</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flatGroups.map((group) => (
          <TableRow key={group.id}>
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
            <TableCell>
              {group.subGroups && group.subGroups.length > 0 ? (
                <Badge variant="secondary">
                  {group.subGroups.length} sub-group
                  {group.subGroups.length > 1 ? 's' : ''}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">None</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="xs" asChild>
                <Link
                  to={paths.app.groupRoleManagement.group.getHref(group.id!)}
                >
                  Manage Roles
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
