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

import { useDeleteAffiliation } from '../api/delete-affiliation';

export const DeleteAffiliation = ({
  affiliationId,
}: {
  affiliationId: string;
}) => {
  const deleteAffiliationMutation = useDeleteAffiliation({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="action">
          DELETE
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Affiliation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this affiliation?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteAffiliationMutation.isPending}
            onClick={() => deleteAffiliationMutation.mutate(affiliationId)}
          >
            {deleteAffiliationMutation.isPending ? (
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
