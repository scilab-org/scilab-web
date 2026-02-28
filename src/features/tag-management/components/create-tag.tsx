import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

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

import { useCreateTag } from '../api/create-tag';

const initialFormData = {
  name: '',
};

export const CreateTag = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createTagMutation = useCreateTag({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Tag created successfully');
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        if (
          errorData?.errors?.[0]?.errorMessage === 'TAG_NAME_ALREADY_EXISTS'
        ) {
          toast.error('Tag name already exists');
        } else {
          toast.error('Failed to create tag');
        }
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createTagMutation.mutate({
      name: formData.name.trim(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="size-4" />
          Create Tag
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create New Tag</SheetTitle>
          <SheetDescription>
            Fill in the details below. Name is required.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-tag-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="create-tag-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-tag-name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Enter tag name"
              required
            />
          </div>
        </form>
        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-tag-form"
            disabled={createTagMutation.isPending || !formData.name.trim()}
          >
            {createTagMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
