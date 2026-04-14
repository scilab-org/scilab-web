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

import { useActivateUser } from '../api/activate-user';

type ActivateUserProps = {
  userId: string;
};

export const ActivateUser = ({ userId }: ActivateUserProps) => {
  const activateUserMutation = useActivateUser({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outlineAction" size="action">
          Enable
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary font-serif text-4xl font-extrabold tracking-tight">
            Activate User
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to activate this user? They will be able to
            access the system again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="darkRed"
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
