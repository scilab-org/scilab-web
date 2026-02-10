import * as React from 'react';
import { Pencil, Upload, X } from 'lucide-react';

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

import { useUpdatePaper } from '../api/update-paper';
import { PaperDto } from '../types';
import { PAPER_STATUS_OPTIONS } from '../constants';

type UpdatePaperProps = {
  paperId: string;
  paper: PaperDto;
};

export const UpdatePaper = ({ paperId, paper }: UpdatePaperProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: paper.title || '',
    abstract: paper.abstract || '',
    doi: paper.doi || '',
    publicationDate: paper.publicationDate
      ? new Date(paper.publicationDate).toISOString().slice(0, 16)
      : '',
    paperType: paper.paperType || '',
    journalName: paper.journalName || '',
    conferenceName: paper.conferenceName || '',
    status: paper.status,
  });
  const [file, setFile] = React.useState<File | undefined>(undefined);

  const updatePaperMutation = useUpdatePaper({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        title: paper.title || '',
        abstract: paper.abstract || '',
        doi: paper.doi || '',
        publicationDate: paper.publicationDate
          ? new Date(paper.publicationDate).toISOString().slice(0, 16)
          : '',
        paperType: paper.paperType || '',
        journalName: paper.journalName || '',
        conferenceName: paper.conferenceName || '',
        status: paper.status,
      });
      setFile(undefined);
    }
  }, [open, paper]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.publicationDate &&
      new Date(formData.publicationDate) > new Date()
    ) {
      return;
    }
    updatePaperMutation.mutate({
      paperId,
      data: {
        title: formData.title,
        abstract: formData.abstract,
        doi: formData.doi,
        publicationDate: formData.publicationDate,
        paperType: formData.paperType,
        journalName: formData.journalName,
        conferenceName: formData.conferenceName,
        status: formData.status,
        file,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Paper</SheetTitle>
          <SheetDescription>
            Update information for &quot;{paper.title}&quot;
          </SheetDescription>
        </SheetHeader>

        <form
          id="update-paper-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="space-y-2">
            <label htmlFor="update-paper-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="update-paper-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter title"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-abstract"
              className="text-sm font-medium"
            >
              Abstract
            </label>
            <textarea
              id="update-paper-abstract"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="Enter abstract"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="update-paper-doi" className="text-sm font-medium">
              DOI
            </label>
            <Input
              id="update-paper-doi"
              value={formData.doi}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, doi: e.target.value }))
              }
              placeholder="Enter DOI"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-pubdate"
              className="text-sm font-medium"
            >
              Publication Date
            </label>
            <Input
              id="update-paper-pubdate"
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

          <div className="space-y-2">
            <label htmlFor="update-paper-type" className="text-sm font-medium">
              Paper Type
            </label>
            <Input
              id="update-paper-type"
              value={formData.paperType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paperType: e.target.value }))
              }
              placeholder="Enter paper type"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-journal"
              className="text-sm font-medium"
            >
              Journal Name
            </label>
            <Input
              id="update-paper-journal"
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

          <div className="space-y-2">
            <label
              htmlFor="update-paper-conference"
              className="text-sm font-medium"
            >
              Conference Name
            </label>
            <Input
              id="update-paper-conference"
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

          <div className="space-y-2">
            <label
              htmlFor="update-paper-status"
              className="text-sm font-medium"
            >
              Status
            </label>
            <select
              id="update-paper-status"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: Number(e.target.value),
                }))
              }
            >
              {PAPER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="update-paper-file" className="text-sm font-medium">
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
                htmlFor="update-paper-file"
                className="border-input hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors"
              >
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                  <Upload className="size-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload PDF</p>
                  <p className="text-muted-foreground text-xs">
                    {paper.filePath ? 'Replace current file' : 'PDF files only'}
                  </p>
                </div>
                <input
                  id="update-paper-file"
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
            type="submit"
            form="update-paper-form"
            disabled={updatePaperMutation.isPending}
          >
            {updatePaperMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
