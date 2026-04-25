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

import { useCreateAffiliation } from '../api/create-affiliation';
import { FIELD_LABEL_CLASS } from '../constants';

const initialFormData = {
  name: '',
  shortName: '',
  rorId: '',
  rorUrl: '',
};

const getRorUrlFromId = (rorId: string) =>
  rorId ? `https://ror.org/${rorId.trim()}` : '';

const getRorIdFromUrl = (rorUrl: string) => {
  const match = rorUrl.trim().match(/ror\.org\/([a-z0-9]+)/i);
  return match?.[1] ?? '';
};

const normalizeRorId = (value: string) => value.toLowerCase().trim();

export const CreateAffiliation = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createAffiliationMutation = useCreateAffiliation({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Affiliation created successfully');
      },
      onError: () => {
        toast.error('Failed to create affiliation');
      },
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    createAffiliationMutation.mutate({
      name: formData.name.trim(),
      shortName: formData.shortName.trim() || undefined,
      rorId: formData.rorId.trim() || undefined,
      rorUrl: formData.rorUrl.trim() || undefined,
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
        <CreateButton className="uppercase">CREATE AFFILIATION</CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Affiliation</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new affiliation.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-affiliation-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="create-affiliation-name"
              className={FIELD_LABEL_CLASS}
            >
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-affiliation-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter affiliation name"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="create-affiliation-short-name"
              className={FIELD_LABEL_CLASS}
            >
              Short name
            </label>
            <Input
              id="create-affiliation-short-name"
              value={formData.shortName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, shortName: e.target.value }))
              }
              placeholder="Enter short name"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="create-affiliation-ror-id"
                className={FIELD_LABEL_CLASS}
              >
                ROR ID
              </label>
              <Input
                id="create-affiliation-ror-id"
                value={formData.rorId}
                onChange={(e) => {
                  const nextRorId = normalizeRorId(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    rorId: nextRorId,
                    rorUrl: getRorUrlFromId(nextRorId),
                  }));
                }}
                placeholder="03esj4g97"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="create-affiliation-ror-url"
                className={FIELD_LABEL_CLASS}
              >
                ROR URL
              </label>
              <Input
                id="create-affiliation-ror-url"
                value={formData.rorUrl}
                onChange={(e) => {
                  const nextRorUrl = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    rorUrl: nextRorUrl,
                    rorId: getRorIdFromUrl(nextRorUrl),
                  }));
                }}
                placeholder="https://ror.org/03esj4g97"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-affiliation-form"
            disabled={
              createAffiliationMutation.isPending || !formData.name.trim()
            }
            variant="darkRed"
          >
            {createAffiliationMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
