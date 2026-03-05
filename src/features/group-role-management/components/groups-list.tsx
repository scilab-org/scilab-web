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
import { BTN } from '@/lib/button-styles';

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
    <div className="overflow-x-auto rounded-xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Name
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Path
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Sub Groups
            </TableHead>
            <TableHead className="text-right font-semibold text-green-900 dark:text-green-200">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flatGroups.map((group, index) => (
            <TableRow
              key={group.id}
              className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
            >
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
                <Button
                  variant="outline"
                  size="xs"
                  asChild
                  className={BTN.VIEW_OUTLINE}
                >
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
    </div>
  );
};
