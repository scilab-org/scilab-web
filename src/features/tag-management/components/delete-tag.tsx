import * as React from 'react';
import { toast } from 'sonner';

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

import { useDeleteTag } from '../api/delete-tag';

type DeleteTagProps = {
  tagId: string;
};

export const DeleteTag = ({ tagId }: DeleteTagProps) => {
  const [open, setOpen] = React.useState(false);

  const deleteTagMutation = useDeleteTag({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Keyword deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete keyword');
      },
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="action">
          DELETE
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary font-serif text-4xl font-extrabold tracking-tight">
            Delete Keyword
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this keyword? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteTagMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteTagMutation.mutate({ tagId });
            }}
          >
            {deleteTagMutation.isPending ? 'DELETING...' : 'DELETE'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
