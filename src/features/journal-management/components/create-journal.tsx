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

import { CreateButton } from '@/components/ui/create-button';
import { usePaperTemplates } from '@/features/paper-template-management/api/get-paper-templates';
import { useCreateJournal } from '../api/create-journal';

const initialFormData = {
  name: '',
  templateId: '',
  startAt: '',
  endAt: '',
  style: '',
  texFile: null as File | null,
  pdfFile: null as File | null,
};

export const CreateJournal = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const templatesQuery = usePaperTemplates({
    params: { PageSize: 1000 },
    queryConfig: { enabled: open },
  });

  const createJournalMutation = useCreateJournal({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Journal created successfully');
      },
      onError: () => {
        toast.error('Failed to create journal');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.templateId ||
      !formData.startAt ||
      !formData.endAt ||
      !formData.style.trim() ||
      !formData.texFile ||
      !formData.pdfFile
    )
      return;

    createJournalMutation.mutate({
      name: formData.name.trim(),
      templateId: formData.templateId,
      startAt: new Date(formData.startAt).toISOString(),
      endAt: new Date(formData.endAt).toISOString(),
      style: formData.style.trim(),
      texFile: formData.texFile,
      pdfFile: formData.pdfFile,
    });
  };

  const templates = templatesQuery.data?.result?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CreateButton size="sm" className="uppercase">
          ADD JOURNAL / CONFERENCE
        </CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Journal / Conference</DialogTitle>
          <DialogDescription>
            Fill in the journal details and upload files.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-journal-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="cj-name" className="text-sm font-medium">
              Journal Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter journal name"
              required
            />
          </div>

          {/* Template */}
          <div className="space-y-1.5">
            <label htmlFor="cj-template" className="text-sm font-medium">
              Template <span className="text-destructive">*</span>
            </label>
            <select
              id="cj-template"
              value={formData.templateId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, templateId: e.target.value }))
              }
              required
              className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} {t.description ? `— ${t.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label htmlFor="cj-style" className="text-sm font-medium">
              Style <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cj-style"
              value={formData.style}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, style: e.target.value }))
              }
              placeholder="Enter Journal / Conference Style"
              required
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-40 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Start At */}
          <div className="space-y-1.5">
            <label htmlFor="cj-startAt" className="text-sm font-medium">
              Start Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-startAt"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startAt: e.target.value }))
              }
              required
            />
          </div>

          {/* End At */}
          <div className="space-y-1.5">
            <label htmlFor="cj-endAt" className="text-sm font-medium">
              End Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-endAt"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endAt: e.target.value }))
              }
              required
            />
          </div>

          {/* TeX File */}
          <div className="space-y-1.5">
            <label htmlFor="cj-texFile" className="text-sm font-medium">
              TeX File <span className="text-destructive">*</span>
            </label>
            <input
              id="cj-texFile"
              type="file"
              accept=".tex"
              required
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  texFile: e.target.files?.[0] ?? null,
                }))
              }
              className="border-input dark:bg-input/30 flex h-10 w-full cursor-pointer rounded-md border bg-transparent px-3 py-2 text-sm file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>

          {/* PDF File */}
          <div className="space-y-1.5">
            <label htmlFor="cj-pdfFile" className="text-sm font-medium">
              PDF File <span className="text-destructive">*</span>
            </label>
            <input
              id="cj-pdfFile"
              type="file"
              accept=".pdf,application/pdf"
              required
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
            form="create-journal-form"
            disabled={createJournalMutation.isPending || !formData.style.trim()}
            variant="darkRed"
            className="uppercase"
          >
            {createJournalMutation.isPending ? 'CREATING...' : 'CREATE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
