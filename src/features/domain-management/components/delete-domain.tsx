import { Loader } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

import { useDeleteDomain } from '../api/delete-domain';

export const DeleteDomain = ({ domainId }: { domainId: string }) => {
  const deleteDomainMutation = useDeleteDomain({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="action">
          DELETE
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Domain</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this domain?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteDomainMutation.isPending}
            onClick={() => deleteDomainMutation.mutate(domainId)}
          >
            {deleteDomainMutation.isPending ? (
              <Loader className="size-4" />
            ) : (
              'DELETE'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
