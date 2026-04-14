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

import { useDeactivateUser } from '../api/deactivate-user';
import { Loader } from 'lucide-react';

type DeactivateUserProps = {
  userId: string;
};

export const DeactivateUser = ({ userId }: DeactivateUserProps) => {
  const deactivateUserMutation = useDeactivateUser({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="action">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary font-serif text-4xl font-extrabold tracking-tight">
            Deactivate User
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate this user? They will no longer
            be able to access the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deactivateUserMutation.isPending}
            onClick={() => deactivateUserMutation.mutate({ userId })}
          >
            {deactivateUserMutation.isPending ? <Loader /> : 'DEACTIVATE'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
