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

import { FIELD_LABEL_CLASS } from '../constants';
import { useCreateAuthorRole } from '../api/create-author-role';

const initialFormData = {
  name: '',
  description: '',
};

export const CreateAuthorRole = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createAuthorRoleMutation = useCreateAuthorRole({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Author role created successfully');
      },
      onError: () => {
        toast.error('Failed to create author role');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    createAuthorRoleMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
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
        <CreateButton className="uppercase">CREATE AUTHOR ROLE</CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Author Role</DialogTitle>
          <DialogDescription>
            Fill in the details below. Name and description are required.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-author-role-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="create-author-role-name"
              className={FIELD_LABEL_CLASS}
            >
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-author-role-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter author role name"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="create-author-role-description"
              className={FIELD_LABEL_CLASS}
            >
              Description <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-author-role-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter description"
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
            form="create-author-role-form"
            disabled={
              createAuthorRoleMutation.isPending ||
              !formData.name.trim() ||
              !formData.description.trim()
            }
            variant="darkRed"
          >
            {createAuthorRoleMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
