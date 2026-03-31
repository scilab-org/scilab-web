import * as React from 'react';
import { useNavigate } from 'react-router';
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
import { useDeletePaper } from '../api/delete-paper';
import { paths } from '@/config/paths';

type DeletePaperProps = {
  paperId: string;
};

export const DeletePaper = ({ paperId }: DeletePaperProps) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const deletePaperMutation = useDeletePaper({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        navigate(paths.app.paperManagement.papers.getHref());
        toast.success('Paper deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete paper');
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
            This action cannot be undone. This will permanently delete this
            paper.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePaperMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deletePaperMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              deletePaperMutation.mutate({ paperId });
            }}
          >
            {deletePaperMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
