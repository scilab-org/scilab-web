import { toast } from 'sonner';

import * as React from 'react';

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

import { useDeleteGapType } from '../api/delete-gap-type';

type DeleteGapTypeProps = {
  gapTypeId: string;
};

export const DeleteGapType = ({ gapTypeId }: DeleteGapTypeProps) => {
  const deleteGapTypeMutation = useDeleteGapType({
    mutationConfig: {
      onSuccess: () => toast.success('Gap type deleted successfully'),
      onError: () => toast.error('Failed to delete gap type'),
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="action">
          DELETE
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary font-serif text-4xl font-extrabold tracking-tight">
            Delete Gap Type
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this gap type? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">CANCEL</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteGapTypeMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteGapTypeMutation.mutate(gapTypeId);
            }}
          >
            {deleteGapTypeMutation.isPending ? 'DELETING...' : 'DELETE'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
