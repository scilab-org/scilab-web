import * as React from 'react';
import { Plus, Upload, X, Tags, Loader2 } from 'lucide-react';

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

import { useCreatePaper } from '../api/create-paper';
import { parsePaperFile } from '../api/parse-paper';
import { BTN } from '@/lib/button-styles';

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

  // Parse state
  const [isParsing, setIsParsing] = React.useState(false);
  const [parsedText, setParsedText] = React.useState('');
  const [suggestedTags, setSuggestedTags] = React.useState<string[]>([]);
  const [tagList, setTagList] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [isAutoTagged, setIsAutoTagged] = React.useState(false);
  const [showTags, setShowTags] = React.useState(false);

  const createPaperMutation = useCreatePaper({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setFile(undefined);
    setParsedText('');
    setSuggestedTags([]);
    setTagList([]);
    setTagInput('');
    setIsAutoTagged(false);
    setShowTags(false);
  };

  const handleFileChange = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setSuggestedTags([]);
    setTagList([]);
    setIsAutoTagged(false);
    setShowTags(false);
    setIsParsing(false);

    // TODO: Replace with real API call when Python service is ready
    // const response = await parsePaperFile(selectedFile);
    // setParsedText(response.parsedText || '');

    // Fake parsedText for development
    setParsedText('This is a sample parsed text from the uploaded PDF file.');
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    setParsedText('');
    setSuggestedTags([]);
    setTagList([]);
    setIsAutoTagged(false);
    setShowTags(false);
  };

  const handleAutoTag = async () => {
    if (!file) return;

    // TODO: Replace with real API call when Python service is ready
    // try {
    //   setIsParsing(true);
    //   const response = await parsePaperFile(file);
    //   setParsedText(response.parsedText || '');
    //   const tags = response.tags || [];
    //   setSuggestedTags(tags);
    //   setTagList([...tags]);
    // } catch {
    //   setParsedText('');
    //   setSuggestedTags([]);
    // } finally {
    //   setIsParsing(false);
    // }

    // Fake data for development
    setIsParsing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const fakeTags = [
      'machine learning',
      'deep learning',
      'natural language processing',
      'computer science',
    ];
    setSuggestedTags(fakeTags);
    setTagList((prev) => {
      const merged = [...prev];
      fakeTags.forEach((tag) => {
        if (!merged.includes(tag)) merged.push(tag);
      });
      return merged;
    });
    setIsParsing(false);

    setIsAutoTagged(true);
    setShowTags(true);
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
    if (!formData.title.trim() || !file) return;
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
      parsedText,
      tagNames: tagList,
      isAutoTagged,
      isIngested: false,
      status: 1,
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" className={BTN.CREATE}>
          <Plus className="size-4" />
          Create Paper
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create New Paper</SheetTitle>
          <SheetDescription>
            Upload a PDF file and fill in the details. Title and file are
            required.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-paper-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          {/* File upload - required, placed first */}
          <div className="space-y-1.5">
            <label htmlFor="create-paper-file" className="text-sm font-medium">
              PDF File <span className="text-destructive">*</span>
            </label>
            {file ? (
              <div className="space-y-3">
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
                    className="size-7 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                    onClick={handleRemoveFile}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Parsing indicator */}
                {isParsing && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Parsing file and generating tags...
                  </div>
                )}

                {/* Auto Tag button - shows when file is selected and not yet auto-tagged */}
                {!isParsing && !showTags && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 ${BTN.AUTO_TAG}`}
                      onClick={handleAutoTag}
                    >
                      <Tags className="size-4" />
                      Auto Tag
                    </Button>
                  </div>
                )}
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
                    PDF files only (required)
                  </p>
                </div>
                <input
                  id="create-paper-file"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          {/* Tags editor - always visible */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tags {tagList.length > 0 && `(${tagList.length})`}
            </label>
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
        </form>
        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-paper-form"
            disabled={
              createPaperMutation.isPending ||
              !formData.title.trim() ||
              !file ||
              isParsing
            }
            className={BTN.CREATE}
          >
            {createPaperMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
