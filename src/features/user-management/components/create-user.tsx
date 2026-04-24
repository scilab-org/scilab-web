import * as React from 'react';
import { Loader } from 'lucide-react';

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

import { CreateButton } from '@/components/ui/create-button';

import { useCreateUser } from '../api/create-user';
import { FIELD_LABEL_CLASS } from '../constants';

const initialFormData = {
  username: '',
  email: '',
  ocrId: '',
  firstName: '',
  lastName: '',
  initialPassword: '',
  temporaryPassword: true,
  avatarImage: null as File | null,
};

const fieldLabel = FIELD_LABEL_CLASS;

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
      ocrId: formData.ocrId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      initialPassword: formData.initialPassword,
      temporaryPassword: formData.temporaryPassword,
      groupNames: null,
      avatarImage: formData.avatarImage,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <CreateButton>Create User</CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user. Username, email, and
            password are required.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-user-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-5 overflow-y-auto px-4 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="cu-username" className={fieldLabel}>
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

          <div className="space-y-2">
            <label htmlFor="cu-email" className={fieldLabel}>
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

          <div className="space-y-2">
            <label htmlFor="cu-ocrId" className={fieldLabel}>
              OCR ID
            </label>
            <Input
              id="cu-ocrId"
              value={formData.ocrId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ocrId: e.target.value }))
              }
              placeholder="Enter OCR ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="cu-firstName" className={fieldLabel}>
                First Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="cu-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="First name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cu-lastName" className={fieldLabel}>
                Last Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="cu-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="cu-password" className={fieldLabel}>
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

          <div className="space-y-2">
            <label className={`flex items-center gap-2 ${fieldLabel}`}>
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

          <div className="space-y-2">
            <label htmlFor="cu-avatar" className={fieldLabel}>
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

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            disabled={createUserMutation.isPending}
            variant="darkRed"
          >
            {createUserMutation.isPending ? <Loader /> : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
