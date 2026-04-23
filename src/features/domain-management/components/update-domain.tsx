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
import { useUpdateDomain } from '../api/update-domain';
import { DomainDto } from '../types';

interface UpdateDomainProps {
  domainId: string;
  domain: DomainDto;
}

const initialFormData = {
  name: '',
};

export const UpdateDomain = ({ domainId, domain }: UpdateDomainProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const updateDomainMutation = useUpdateDomain({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Domain updated successfully');
      },
      onError: () => {
        toast.error('Failed to update domain');
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({ name: domain.name || '' });
    }
  }, [open, domain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDomainMutation.mutate({
      domainId,
      data: { name: formData.name.trim() },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction">EDIT</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Domain</DialogTitle>
          <DialogDescription>
            Update information for &quot;{domain.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-domain-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="update-domain-name" className={FIELD_LABEL_CLASS}>
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-domain-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
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
            form="update-domain-form"
            disabled={updateDomainMutation.isPending || !formData.name.trim()}
            variant="darkRed"
          >
            {updateDomainMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
