import * as React from 'react';
import { Plus, Upload, X } from 'lucide-react';

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

import { useCreatePaper } from '../api/create-paper';

const initialFormData = {
  title: '',
  abstract: '',
  doi: '',
  publicationDate: '',
  paperType: '',
  journalName: '',
  conferenceName: '',
};

export const CreatePaper = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [file, setFile] = React.useState<File | undefined>(undefined);

  const createPaperMutation = useCreatePaper({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        setFile(undefined);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (
      formData.publicationDate &&
      new Date(formData.publicationDate) > new Date()
    ) {
      return;
    }
    createPaperMutation.mutate({
      title: formData.title,
      abstract: formData.abstract,
      doi: formData.doi,
      publicationDate: formData.publicationDate,
      paperType: formData.paperType,
      journalName: formData.journalName,
      conferenceName: formData.conferenceName,
      file,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="size-4" />
          Create Paper
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create New Paper</SheetTitle>
          <SheetDescription>
            Fill in the details below. Only title is required.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-paper-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="create-paper-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-paper-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter paper title"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-paper-doi" className="text-sm font-medium">
              DOI
            </label>
            <Input
              id="create-paper-doi"
              value={formData.doi}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, doi: e.target.value }))
              }
              placeholder="e.g. 10.1000/xyz123"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-abstract"
              className="text-sm font-medium"
            >
              Abstract
            </label>
            <textarea
              id="create-paper-abstract"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="Enter abstract"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="create-paper-pubdate"
                className="text-sm font-medium"
              >
                Publication Date
              </label>
              <Input
                id="create-paper-pubdate"
                type="datetime-local"
                value={formData.publicationDate}
                max={new Date().toISOString().slice(0, 16)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    publicationDate: e.target.value,
                  }))
                }
              />
              {formData.publicationDate &&
                new Date(formData.publicationDate) > new Date() && (
                  <p className="text-destructive text-xs">
                    Publication date cannot be in the future.
                  </p>
                )}
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="create-paper-type"
                className="text-sm font-medium"
              >
                Paper Type
              </label>
              <Input
                id="create-paper-type"
                value={formData.paperType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paperType: e.target.value,
                  }))
                }
                placeholder="e.g. Research, Review"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-journal"
              className="text-sm font-medium"
            >
              Journal Name
            </label>
            <Input
              id="create-paper-journal"
              value={formData.journalName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  journalName: e.target.value,
                }))
              }
              placeholder="Enter journal name"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-conference"
              className="text-sm font-medium"
            >
              Conference Name
            </label>
            <Input
              id="create-paper-conference"
              value={formData.conferenceName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conferenceName: e.target.value,
                }))
              }
              placeholder="Enter conference name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-paper-file" className="text-sm font-medium">
              PDF File
            </label>
            {file ? (
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Upload className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => setFile(undefined)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="create-paper-file"
                className="border-input hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors"
              >
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                  <Upload className="size-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload PDF</p>
                  <p className="text-muted-foreground text-xs">
                    PDF files only
                  </p>
                </div>
                <input
                  id="create-paper-file"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </form>
        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-paper-form"
            disabled={createPaperMutation.isPending || !formData.title.trim()}
          >
            {createPaperMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
