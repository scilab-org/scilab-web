import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

import { useUpdateGapType } from '../api/update-gap-type';
import { GapTypeDto } from '../types';

type UpdateGapTypeProps = {
  gapTypeId: string;
  gapType: GapTypeDto;
};

export const UpdateGapType = ({ gapTypeId, gapType }: UpdateGapTypeProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: gapType.name || '' });

  const updateGapTypeMutation = useUpdateGapType({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Gap type updated successfully');
      },
      onError: () => {
        toast.error('Failed to update gap type');
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({ name: gapType.name || '' });
    }
  }, [gapType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    updateGapTypeMutation.mutate({
      gapTypeId,
      data: { name: formData.name.trim() },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction">EDIT</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Gap Type</DialogTitle>
          <DialogDescription>
            Update information for &quot;{gapType.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-gap-type-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="update-gap-type-name"
              className="text-sm font-medium"
            >
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-gap-type-name"
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
            form="update-gap-type-form"
            disabled={updateGapTypeMutation.isPending || !formData.name.trim()}
            variant="darkRed"
          >
            {updateGapTypeMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
