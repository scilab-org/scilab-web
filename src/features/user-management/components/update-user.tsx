import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { useUpdateUser } from '../api/update-user';
import { UserDto } from '../types';
import { Loader } from 'lucide-react';
import { FIELD_LABEL_CLASS } from '../constants';
import { UserAvatar } from '@/components/ui/user-avatar';

type UpdateUserProps = {
  userId: string;
  user: UserDto;
};

const fieldLabel = FIELD_LABEL_CLASS;

export const UpdateUser = ({ userId, user }: UpdateUserProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    enabled: user.enabled,
    groupNames: user.groups?.map((g) => g.name!).filter(Boolean) || [],
    avatarImage: null as File | null,
  });
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const updateUserMutation = useUpdateUser({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        enabled: user.enabled,
        groupNames: user.groups?.map((g) => g.name!).filter(Boolean) || [],
        avatarImage: null,
      });
      setAvatarPreview(null);
    }
  }, [open, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate({
      userId,
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        enabled: formData.enabled,
        groupNames: formData.groupNames,
        avatarImage: formData.avatarImage,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="action">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update information for {user.username}
          </DialogDescription>
        </DialogHeader>

        <form
          id="update-user-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="uu-firstName" className={fieldLabel}>
              First Name
            </label>
            <Input
              id="uu-firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="uu-lastName" className={fieldLabel}>
              Last Name
            </label>
            <Input
              id="uu-lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              placeholder="Enter last name"
            />
          </div>

          <div className="space-y-2">
            <label className={`flex items-center gap-2 ${fieldLabel}`}>
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="rounded"
              />
              Enabled
            </label>
          </div>

          <div className="space-y-2">
            <label htmlFor="uu-avatar" className={fieldLabel}>
              Avatar Image
            </label>
            <div className="flex items-center gap-4">
              <UserAvatar
                avatarUrl={avatarPreview ?? user.avatarUrl}
                firstName={user.firstName}
                username={user.username}
                size="md"
              />
              <div className="flex-1 space-y-1">
                <Input
                  id="uu-avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData((prev) => ({ ...prev, avatarImage: file }));
                    if (file) {
                      setAvatarPreview(URL.createObjectURL(file));
                    } else {
                      setAvatarPreview(null);
                    }
                  }}
                />
                {avatarPreview && (
                  <p className="text-muted-foreground text-xs">
                    {formData.avatarImage?.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            CANCEL
          </Button>
          <Button
            variant="darkRed"
            type="submit"
            form="update-user-form"
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? <Loader /> : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
