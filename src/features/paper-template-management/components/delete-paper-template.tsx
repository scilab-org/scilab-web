import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { useDeletePaperTemplate } from '../api/delete-paper-template';

type DeletePaperTemplateProps = {
  id: string;
  name: string;
};

export const DeletePaperTemplate = ({ id, name }: DeletePaperTemplateProps) => {
  const [open, setOpen] = React.useState(false);

  const mutation = useDeletePaperTemplate({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Template deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete template');
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
          <AlertDialogTitle>Delete template?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{' '}
            <span className="text-foreground font-semibold">
              &ldquo;{name}&rdquo;
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate({ id });
            }}
          >
            {mutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
