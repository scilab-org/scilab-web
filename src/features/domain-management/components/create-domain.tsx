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
import { useCreateDomain } from '../api/create-domain';

const initialFormData = {
  name: '',
};

export const CreateDomain = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createDomainMutation = useCreateDomain({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Domain created successfully');
      },
      onError: () => {
        toast.error('Failed to create domain');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDomainMutation.mutate({ name: formData.name.trim() });
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
        <CreateButton className="uppercase">CREATE DOMAIN</CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Domain</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new domain.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-domain-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="create-domain-name" className={FIELD_LABEL_CLASS}>
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-domain-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter domain name"
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
            form="create-domain-form"
            disabled={createDomainMutation.isPending || !formData.name.trim()}
            variant="darkRed"
          >
            {createDomainMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
