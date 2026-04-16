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

import { useUpdateJournal } from '../api/update-journal';
import { JournalDto } from '../types';

type UpdateJournalProps = {
  journalId: string;
  journal: JournalDto;
};

const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const UpdateJournal = ({ journalId, journal }: UpdateJournalProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    startAt: toDatetimeLocal(journal.startAt),
    endAt: toDatetimeLocal(journal.endAt),
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        startAt: toDatetimeLocal(journal.startAt),
        endAt: toDatetimeLocal(journal.endAt),
      });
    }
  }, [open, journal]);

  const updateJournalMutation = useUpdateJournal({
    mutationConfig: {
      onSuccess: (response) => {
        if (response?.value) {
          setOpen(false);
          toast.success('Journal updated successfully');
          return;
        }
        toast.error(
          'Update did not apply. Please check your input and try again.',
        );
      },
      onError: () => {
        toast.error('Failed to update journal');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startAt || !formData.endAt) return;
    updateJournalMutation.mutate({
      journalId,
      data: {
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction" size="action">
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Journal</DialogTitle>
          <DialogDescription>
            Update the journal&apos;s start and end dates.
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-journal-form"
          onSubmit={handleSubmit}
          className="space-y-4 px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="uj-startAt" className="text-sm font-medium">
              Start Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="uj-startAt"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startAt: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="uj-endAt" className="text-sm font-medium">
              End Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="uj-endAt"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endAt: e.target.value }))
              }
              required
            />
          </div>
        </form>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="uppercase"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="update-journal-form"
            disabled={updateJournalMutation.isPending}
            variant="darkRed"
            className="uppercase"
          >
            {updateJournalMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
