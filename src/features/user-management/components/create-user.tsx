import * as React from 'react';
import { Plus } from 'lucide-react';

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

import { BTN } from '@/lib/button-styles';
import { useCreateUser } from '../api/create-user';

const initialFormData = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  initialPassword: '',
  temporaryPassword: true,
  avatarImage: null as File | null,
};

export const CreateUser = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createUserMutation = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      initialPassword: formData.initialPassword,
      temporaryPassword: formData.temporaryPassword,
      groupNames: null,
      avatarImage: formData.avatarImage,
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" className={BTN.CREATE}>
          <Plus className="size-4" />
          Create User
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Create New User</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new user. Username, email, and
            password are required.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-user-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="cu-username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </label>
            <Input
              id="cu-username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Enter username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cu-email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="cu-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Enter email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cu-firstName" className="text-sm font-medium">
              First Name
            </label>
            <Input
              id="cu-firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cu-lastName" className="text-sm font-medium">
              Last Name
            </label>
            <Input
              id="cu-lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Enter last name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cu-password" className="text-sm font-medium">
              Initial Password <span className="text-destructive">*</span>
            </label>
            <Input
              id="cu-password"
              type="password"
              value={formData.initialPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  initialPassword: e.target.value,
                }))
              }
              placeholder="Enter initial password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.temporaryPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    temporaryPassword: e.target.checked,
                  }))
                }
                className="rounded"
              />
              Temporary Password
            </label>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cu-avatar" className="text-sm font-medium">
              Avatar Image
            </label>
            <Input
              id="cu-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFormData((prev) => ({ ...prev, avatarImage: file }));
              }}
            />
            {formData.avatarImage && (
              <p className="text-muted-foreground text-xs">
                {formData.avatarImage.name}
              </p>
            )}
          </div>
        </form>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            disabled={createUserMutation.isPending}
            className={BTN.CREATE}
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
