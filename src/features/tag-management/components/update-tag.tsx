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

import { useUpdateTag } from '../api/update-tag';
import { TagDto } from '../types';

type UpdateTagProps = {
  tagId: string;
  tag: TagDto;
};

export const UpdateTag = ({ tagId, tag }: UpdateTagProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: tag.name || '',
  });

  const updateTagMutation = useUpdateTag({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Tag updated successfully');
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        if (
          errorData?.errors?.[0]?.errorMessage === 'TAG_NAME_ALREADY_EXISTS'
        ) {
          toast.error('Tag name already exists');
        } else {
          toast.error('Failed to update tag');
        }
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: tag.name || '',
      });
    }
  }, [open, tag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    updateTagMutation.mutate({
      tagId,
      data: {
        name: formData.name.trim(),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction" size="action">
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            Update information for &quot;{tag.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <form
          id="update-tag-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="space-y-2">
            <label htmlFor="update-tag-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-tag-name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Enter tag name"
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
            form="update-tag-form"
            disabled={updateTagMutation.isPending || !formData.name.trim()}
            variant="darkRed"
          >
            {updateTagMutation.isPending ? 'Saving...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
