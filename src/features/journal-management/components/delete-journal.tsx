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
import { useDeleteJournal } from '../api/delete-journal';

type DeleteJournalProps = {
  journalId: string;
};

export const DeleteJournal = ({ journalId }: DeleteJournalProps) => {
  const [open, setOpen] = React.useState(false);

  const deleteJournalMutation = useDeleteJournal({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Journal deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete journal');
      },
    },
  });

  const handleDelete = () => {
    deleteJournalMutation.mutate(journalId);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Journal</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this journal? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={BTN.CANCEL}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteJournalMutation.isPending}
            className={`${BTN.DANGER} disabled:opacity-50`}
          >
            {deleteJournalMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
