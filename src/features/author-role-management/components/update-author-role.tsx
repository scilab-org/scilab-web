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

import { FIELD_LABEL_CLASS } from '../constants';
import { useUpdateAuthorRole } from '../api/update-author-role';
import { AuthorRoleDto } from '../types';

type UpdateAuthorRoleProps = {
  authorRoleId: string;
  authorRole: AuthorRoleDto;
};

const initialFormData = {
  name: '',
  description: '',
};

export const UpdateAuthorRole = ({
  authorRoleId,
  authorRole,
}: UpdateAuthorRoleProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const updateAuthorRoleMutation = useUpdateAuthorRole({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Author role updated successfully');
      },
      onError: () => {
        toast.error('Failed to update author role');
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: authorRole.name || '',
        description: authorRole.description || '',
      });
    }
  }, [authorRole, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    updateAuthorRoleMutation.mutate({
      authorRoleId,
      data: {
        name: formData.name.trim(),
        description: formData.description.trim(),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction">EDIT</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Author Role</DialogTitle>
          <DialogDescription>
            Update information for &quot;{authorRole.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-author-role-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="update-author-role-name"
              className={FIELD_LABEL_CLASS}
            >
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-author-role-name"
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
              htmlFor="update-author-role-description"
              className={FIELD_LABEL_CLASS}
            >
              Description <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-author-role-description"
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
            form="update-author-role-form"
            disabled={
              updateAuthorRoleMutation.isPending ||
              !formData.name.trim() ||
              !formData.description.trim()
            }
            variant="darkRed"
          >
            {updateAuthorRoleMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
