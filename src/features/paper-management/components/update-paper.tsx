import * as React from 'react';
import { Pencil, X, Tags, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { BTN } from '@/lib/button-styles';

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
  const [tagList, setTagList] = React.useState<string[]>(paper.tagNames || []);
  const [tagInput, setTagInput] = React.useState('');
  const [isAutoTagging, setIsAutoTagging] = React.useState(false);
  const [isAutoTagged, setIsAutoTagged] = React.useState(
    paper.isAutoTagged || false,
  );

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
      setTagList(paper.tagNames || []);
      setTagInput('');
      setIsAutoTagging(false);
      setIsAutoTagged(paper.isAutoTagged || false);
    }
  }, [open, paper]);

  const handleAutoTag = async () => {
    const currentParsedText = paper.parsedText || '';
    if (!currentParsedText) return;

    // TODO: Replace with real API call when Python service is ready
    // try {
    //   setIsAutoTagging(true);
    //   const response = await autoTagPaper({
    //     parsedText: currentParsedText,
    //     tagNames: tagList,
    //   });
    //   const newTags = response.tags || [];
    //   setTagList([...newTags]);
    //   setIsAutoTagged(true);
    // } catch {
    //   // handle error
    // } finally {
    //   setIsAutoTagging(false);
    // }

    // Fake data for development
    setIsAutoTagging(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const fakeTags = [
      'machine learning',
      'deep learning',
      'natural language processing',
      'computer science',
    ];
    setTagList([...fakeTags]);
    setIsAutoTagging(false);
    setIsAutoTagged(true);
  };

  const handleAddTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tagList.includes(trimmed)) {
      setTagList((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tagList.length > 0) {
      setTagList((prev) => prev.slice(0, -1));
    }
  };

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
        tagNames: tagList,
        isAutoTagged,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1 ${BTN.EDIT_OUTLINE}`}
        >
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Tags {tagList.length > 0 && `(${tagList.length})`}
              </label>
              {paper.parsedText && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoTag}
                  disabled={isAutoTagging}
                  className={`h-7 gap-1 text-xs ${BTN.AUTO_TAG}`}
                >
                  {isAutoTagging ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Tagging...
                    </>
                  ) : (
                    <>
                      <Tags className="size-3" />
                      Auto Tag
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="border-input bg-background focus-within:ring-ring flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5 shadow-sm transition-colors focus-within:ring-1">
              {tagList.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) handleAddTag(tagInput);
                }}
                placeholder={
                  tagList.length === 0 ? 'Type a tag and press Enter...' : ''
                }
                className="placeholder:text-muted-foreground min-w-30 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
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
        </form>

        <SheetFooter>
          <Button
            type="submit"
            form="update-paper-form"
            disabled={updatePaperMutation.isPending}
            className={BTN.EDIT}
          >
            {updatePaperMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
