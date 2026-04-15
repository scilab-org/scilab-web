import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useGroupRoles } from '../api/get-group-roles';
import { AddRolesToGroup } from './add-roles-to-group';
import { RemoveRolesFromGroup } from './remove-roles-from-group';

export const GroupRolesView = ({ groupId }: { groupId: string }) => {
  const groupRolesQuery = useGroupRoles({ groupId });

  if (groupRolesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const roles = groupRolesQuery.data?.result;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddRolesToGroup
          groupId={groupId}
          existingRoleNames={roles?.map((r) => r.name!).filter(Boolean) || []}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Roles</CardTitle>
          <CardDescription>
            Roles currently assigned to this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!roles || roles.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No roles assigned to this group.
            </p>
          ) : (
            <div className="min-h-[400px] overflow-x-auto rounded-xl border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Type
                    </TableHead>
                    <TableHead className="text-center font-semibold text-green-900 dark:text-green-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role, index) => (
                    <TableRow
                      key={role.id}
                      className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
                    >
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        {role.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {role.composite && (
                            <Badge variant="secondary">Composite</Badge>
                          )}
                          {role.clientRole && (
                            <Badge variant="outline">Client</Badge>
                          )}
                          {!role.composite && !role.clientRole && (
                            <Badge variant="outline">Realm</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <RemoveRolesFromGroup
                          groupId={groupId}
                          roleNames={[role.name!]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
