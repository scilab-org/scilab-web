import * as React from 'react';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { BTN } from '@/lib/button-styles';
import { useRealmRoles } from '../api/get-realm-roles';
import { useAddRolesToGroup } from '../api/add-roles-to-group';

type AddRolesToGroupProps = {
  groupId: string;
  existingRoleNames: string[];
};

export const AddRolesToGroup = ({
  groupId,
  existingRoleNames,
}: AddRolesToGroupProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  const realmRolesQuery = useRealmRoles();

  const addRolesMutation = useAddRolesToGroup({
    mutationConfig: {
      onSuccess: () => {
        setIsOpen(false);
        setSelectedRoles([]);
      },
    },
  });

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  const handleSubmit = () => {
    if (selectedRoles.length === 0) return;
    addRolesMutation.mutate({ groupId, roleNames: selectedRoles });
  };

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)} className={BTN.CREATE}>
        <Plus className="size-4" />
        Add Roles
      </Button>
    );
  }

  const availableRoles =
    realmRolesQuery.data?.result?.filter(
      (role) => role.name && !existingRoleNames.includes(role.name),
    ) || [];

  return (
    <div className="bg-card w-full rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">Add Roles to Group</h3>

      {realmRolesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      ) : availableRoles.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          All available roles are already assigned.
        </p>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {availableRoles.map((role) => (
            <Badge
              key={role.id}
              variant={
                selectedRoles.includes(role.name!) ? 'default' : 'outline'
              }
              className="cursor-pointer"
              onClick={() => toggleRole(role.name!)}
            >
              {role.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setSelectedRoles([]);
          }}
          className={BTN.CANCEL}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={selectedRoles.length === 0 || addRolesMutation.isPending}
          onClick={handleSubmit}
          className={BTN.CREATE}
        >
          {addRolesMutation.isPending
            ? 'Adding...'
            : `Add ${selectedRoles.length} Role${selectedRoles.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};
