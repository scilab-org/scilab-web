import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useCreateUser } from '../api/create-user';

export const CreateUser = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    initialPassword: '',
    temporaryPassword: true,
  });

  const createUserMutation = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        setIsOpen(false);
        setFormData({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          initialPassword: '',
          temporaryPassword: true,
        });
      },
    },
  });

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
    });
  };

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="size-4" />
        Create User
      </Button>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">Create New User</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username *</label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Enter username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email *</label>
            <Input
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
            <label className="text-sm font-medium">First Name</label>
            <Input
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <Input
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Enter last name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Password *</label>
            <Input
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
          <div className="flex items-end space-x-2">
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
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};
