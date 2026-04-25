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

import { useUpdateAffiliation } from '../api/update-affiliation';
import { FIELD_LABEL_CLASS } from '../constants';
import { AffiliationDto } from '../types';

interface UpdateAffiliationProps {
  affiliationId: string;
  affiliation: AffiliationDto;
}

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

export const UpdateAffiliation = ({
  affiliationId,
  affiliation,
}: UpdateAffiliationProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const updateAffiliationMutation = useUpdateAffiliation({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Affiliation updated successfully');
      },
      onError: () => {
        toast.error('Failed to update affiliation');
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: affiliation.name || '',
        shortName: affiliation.shortName || '',
        rorId: affiliation.rorId || '',
        rorUrl: affiliation.rorUrl || '',
      });
    }
  }, [open, affiliation]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateAffiliationMutation.mutate({
      affiliationId,
      data: {
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || undefined,
        rorId: formData.rorId.trim() || undefined,
        rorUrl: formData.rorUrl.trim() || undefined,
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
          <DialogTitle>Edit Affiliation</DialogTitle>
          <DialogDescription>
            Update information for &quot;{affiliation.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <form
          id="update-affiliation-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="update-affiliation-name"
              className={FIELD_LABEL_CLASS}
            >
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-affiliation-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-affiliation-short-name"
              className={FIELD_LABEL_CLASS}
            >
              Short name
            </label>
            <Input
              id="update-affiliation-short-name"
              value={formData.shortName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, shortName: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="update-affiliation-ror-id"
                className={FIELD_LABEL_CLASS}
              >
                ROR ID
              </label>
              <Input
                id="update-affiliation-ror-id"
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
                htmlFor="update-affiliation-ror-url"
                className={FIELD_LABEL_CLASS}
              >
                ROR URL
              </label>
              <Input
                id="update-affiliation-ror-url"
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
            form="update-affiliation-form"
            disabled={
              updateAffiliationMutation.isPending || !formData.name.trim()
            }
            variant="darkRed"
          >
            {updateAffiliationMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
