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

import { useDeleteAuthorRole } from '../api/delete-author-role';

export const DeleteAuthorRole = ({
  authorRoleId,
}: {
  authorRoleId: string;
}) => {
  const deleteAuthorRoleMutation = useDeleteAuthorRole({});

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="action" variant="destructive">
          DELETE
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete CRediT Author</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this CRediT author?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteAuthorRoleMutation.isPending}
            onClick={() => deleteAuthorRoleMutation.mutate(authorRoleId)}
          >
            {deleteAuthorRoleMutation.isPending ? (
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
