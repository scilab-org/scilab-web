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

import { useRetryIngestion } from '../api/retry-ingestion';

type RetryIngestionProps = {
  paperId: string;
};

export const RetryIngestion = ({ paperId }: RetryIngestionProps) => {
  const [open, setOpen] = React.useState(false);

  const retryIngestionMutation = useRetryIngestion({
    paperId,
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Ingestion re-queued successfully');
      },
      onError: () => {
        toast.error('Failed to retry ingestion');
      },
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="action" size="action">
          RETRY INGEST
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retry Ingestion?</AlertDialogTitle>
          <AlertDialogDescription>
            This will retry ingestion for this paper. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={retryIngestionMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={retryIngestionMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              retryIngestionMutation.mutate({ paperId });
            }}
          >
            {retryIngestionMutation.isPending ? 'Re-queuing...' : 'Retry'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
