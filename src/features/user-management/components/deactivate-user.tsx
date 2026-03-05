import * as React from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { BTN } from '@/lib/button-styles';

import { useDeactivateUser } from '../api/deactivate-user';

type DeactivateUserProps = {
  userId: string;
};

export const DeactivateUser = ({ userId }: DeactivateUserProps) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const deactivateUserMutation = useDeactivateUser({
    mutationConfig: {
      onSuccess: () => {
        setIsConfirming(false);
      },
    },
  });

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">Deactivate this user?</span>
        <Button
          variant="destructive"
          size="xs"
          disabled={deactivateUserMutation.isPending}
          onClick={() => deactivateUserMutation.mutate({ userId })}
          className={BTN.DANGER}
        >
          {deactivateUserMutation.isPending ? 'Deactivating...' : 'Confirm'}
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
      Deactivate
    </Button>
  );
};
