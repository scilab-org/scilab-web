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

export const UpdateJournal = ({ journalId, journal }: UpdateJournalProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: journal.name ?? '',
    ranking: journal.ranking ?? '',
    url: journal.url ?? '',
    style: journal.style ?? '',
    texFile: null as File | null,
    pdfFile: null as File | null,
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: journal.name ?? '',
        ranking: journal.ranking ?? '',
        url: journal.url ?? '',
        style: journal.style ?? '',
        texFile: null,
        pdfFile: null,
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
    updateJournalMutation.mutate({
      journalId,
      data: {
        name: formData.name.trim(),
        ranking: formData.ranking.trim(),
        url: formData.url.trim(),
        style: formData.style.trim(),
        texFile: formData.texFile,
        pdfFile: formData.pdfFile,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Update Journal</DialogTitle>
          <DialogDescription>
            Update the journal&apos;s information and files.
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-journal-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="uj-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="uj-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter journal name"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="uj-ranking" className="text-sm font-medium">
              Ranking
            </label>
            <Input
              id="uj-ranking"
              value={formData.ranking}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ranking: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="uj-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="uj-url"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://example.com/journal"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="uj-style" className="text-sm font-medium">
              Style
            </label>
            <textarea
              id="uj-style"
              value={formData.style}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, style: e.target.value }))
              }
              placeholder="Enter Journal / Conference Style"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="uj-texFile" className="text-sm font-medium">
              TeX File
            </label>
            <input
              id="uj-texFile"
              type="file"
              accept=".tex"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  texFile: e.target.files?.[0] ?? null,
                }))
              }
              className="border-input dark:bg-input/30 flex h-10 w-full cursor-pointer rounded-md border bg-transparent px-3 py-2 text-sm file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="uj-pdfFile" className="text-sm font-medium">
              PDF File
            </label>
            <input
              id="uj-pdfFile"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pdfFile: e.target.files?.[0] ?? null,
                }))
              }
              className="border-input dark:bg-input/30 flex h-10 w-full cursor-pointer rounded-md border bg-transparent px-3 py-2 text-sm file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
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
