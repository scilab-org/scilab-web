import * as React from 'react';
import { Trash2 } from 'lucide-react';
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

import { BTN } from '@/lib/button-styles';
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
        toast.success('Tag deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete tag');
      },
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className={BTN.DANGER}>
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this tag.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTagMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteTagMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteTagMutation.mutate({ tagId });
            }}
          >
            {deleteTagMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
