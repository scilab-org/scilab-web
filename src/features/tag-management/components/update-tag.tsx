import * as React from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
    const cleaned = formData.name.trim().replace(/\s+/g, '');
    const tagName = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
    updateTagMutation.mutate({
      tagId,
      data: {
        name: tagName,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Tag</SheetTitle>
          <SheetDescription>
            Update information for &quot;{tag.name}&quot;
          </SheetDescription>
        </SheetHeader>

        <form
          id="update-tag-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="space-y-2">
            <label htmlFor="update-tag-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-tag-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter tag name"
              required
            />
          </div>
        </form>

        <SheetFooter>
          <Button
            type="submit"
            form="update-tag-form"
            disabled={updateTagMutation.isPending || !formData.name.trim()}
          >
            {updateTagMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
