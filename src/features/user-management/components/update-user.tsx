import * as React from 'react';
import { Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { useGroups } from '@/features/group-role-management/api/get-groups';

import { BTN } from '@/lib/button-styles';
import { useUpdateUser } from '../api/update-user';
import { UserDto } from '../types';

type UpdateUserProps = {
  userId: string;
  user: UserDto;
};

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

  const groupsQuery = useGroups();
  const allGroups = groupsQuery.data?.result || [];

  const updateUserMutation = useUpdateUser({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
      },
    },
  });

  // Reset form when drawer opens
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

  const toggleGroup = (groupName: string) => {
    setFormData((prev) => ({
      ...prev,
      groupNames: prev.groupNames.includes(groupName)
        ? prev.groupNames.filter((n) => n !== groupName)
        : [...prev.groupNames, groupName],
    }));
  };

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={BTN.EDIT_OUTLINE}>
          <Pencil className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            Update information for {user.username}
          </SheetDescription>
        </SheetHeader>

        <form
          id="update-user-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="uu-firstName" className="text-sm font-medium">
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

          <div className="space-y-1.5">
            <label htmlFor="uu-lastName" className="text-sm font-medium">
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium">
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
            <label htmlFor="uu-avatar" className="text-sm font-medium">
              Avatar Image
            </label>
            {/* Current / preview */}
            <div className="flex items-center gap-4">
              <span className="border-border relative inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-200 dark:bg-slate-700">
                {avatarPreview || user.avatarUrl ? (
                  <img
                    src={avatarPreview ?? user.avatarUrl!}
                    alt={user.username ?? ''}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-slate-600 select-none dark:text-slate-300">
                    {(
                      user.firstName?.[0] ??
                      user.username?.[0] ??
                      '?'
                    ).toUpperCase()}
                  </span>
                )}
              </span>
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

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="update-user-form"
            disabled={updateUserMutation.isPending}
            className={BTN.EDIT}
          >
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
