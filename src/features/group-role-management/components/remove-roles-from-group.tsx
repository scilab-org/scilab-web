import * as React from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { BTN } from '@/lib/button-styles';

import { useRemoveRolesFromGroup } from '../api/remove-roles-from-group';

type RemoveRolesFromGroupProps = {
  groupId: string;
  roleNames: string[];
};

export const RemoveRolesFromGroup = ({
  groupId,
  roleNames,
}: RemoveRolesFromGroupProps) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const removeRolesMutation = useRemoveRolesFromGroup({
    mutationConfig: {
      onSuccess: () => {
        setIsConfirming(false);
      },
    },
  });

  if (isConfirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-red-600">Remove?</span>
        <Button
          variant="destructive"
          size="xs"
          disabled={removeRolesMutation.isPending}
          onClick={() => removeRolesMutation.mutate({ groupId, roleNames })}
          className={BTN.DANGER}
        >
          {removeRolesMutation.isPending ? 'Removing...' : 'Confirm'}
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setIsConfirming(false)}
          className={BTN.CANCEL}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="xs"
      onClick={() => setIsConfirming(true)}
      className={BTN.DANGER}
    >
      <Trash2 className="size-3" />
      Remove
    </Button>
  );
};
