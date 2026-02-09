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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
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
                    <TableCell className="text-right">
                      <RemoveRolesFromGroup
                        groupId={groupId}
                        roleNames={[role.name!]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
