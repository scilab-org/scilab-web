import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CreateButton } from '@/components/ui/create-button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useCreateGapType } from '../api/create-gap-type';

const initialFormData = {
  name: '',
};

export const CreateGapType = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createGapTypeMutation = useCreateGapType({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Gap type created successfully');
      },
      onError: () => {
        toast.error('Failed to create gap type');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    createGapTypeMutation.mutate({
      name: formData.name.trim(),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setFormData(initialFormData);
      }}
    >
      <DialogTrigger asChild>
        <CreateButton className="uppercase">CREATE GAP TYPE</CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Gap Type</DialogTitle>
          <DialogDescription>
            Fill in the details below. Name is required.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-gap-type-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="create-gap-type-name"
              className="text-sm font-medium"
            >
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-gap-type-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter gap type name"
              required
            />
          </div>
        </form>
        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-gap-type-form"
            disabled={createGapTypeMutation.isPending || !formData.name.trim()}
            variant="darkRed"
          >
            {createGapTypeMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
