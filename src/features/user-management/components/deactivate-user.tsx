import { Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { BTN } from '@/lib/button-styles';

import { useDeactivateUser } from '../api/deactivate-user';

type DeactivateUserProps = {
  userId: string;
};

export const DeactivateUser = ({ userId }: DeactivateUserProps) => {
  const deactivateUserMutation = useDeactivateUser({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className={BTN.DANGER}>
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate this user? They will no longer
            be able to access the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={BTN.CANCEL}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={BTN.DANGER}
            disabled={deactivateUserMutation.isPending}
            onClick={() => deactivateUserMutation.mutate({ userId })}
          >
            {deactivateUserMutation.isPending
              ? 'Deactivating...'
              : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
