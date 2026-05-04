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

import { useDeleteCheckList } from '../api/delete-checklist';

export const DeleteCheckList = ({ checkListId }: { checkListId: string }) => {
  const deleteCheckListMutation = useDeleteCheckList({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="action">
          DELETE
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Check List</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this check list item?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteCheckListMutation.isPending}
            onClick={() => deleteCheckListMutation.mutate(checkListId)}
          >
            {deleteCheckListMutation.isPending ? (
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
