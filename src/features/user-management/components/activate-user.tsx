import { CheckCircle } from 'lucide-react';

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

import { useActivateUser } from '../api/activate-user';

type ActivateUserProps = {
  userId: string;
};

export const ActivateUser = ({ userId }: ActivateUserProps) => {
  const minRows = 10;
  const activateUserMutation = useActivateUser({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className={BTN.SUCCESS}>
          <CheckCircle className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to activate this user? They will be able to
            access the system again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={BTN.CANCEL}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={BTN.SUCCESS}
            disabled={activateUserMutation.isPending}
            onClick={() => activateUserMutation.mutate({ userId })}
          >
            {activateUserMutation.isPending ? 'Activating...' : 'Activate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
