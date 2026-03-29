import * as React from 'react';
import { Plus, Upload, X, Tags, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { autoTagPaper } from '../api/auto-tag-paper';
import { TagAutocompleteInput } from './tag-autocomplete-input';
import { BTN } from '@/lib/button-styles';
import { PAPER_STATUS_OPTIONS } from '../constants';

const initialFormData = {
  title: '',
  abstract: '',
  doi: '',
  publicationDate: '',
  paperType: '',
  journalName: '',
  conferenceName: '',
  status: 5,
};

export const CreatePaper = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [file, setFile] = React.useState<File | undefined>(undefined);

  // Parse state
  const [isParsing, setIsParsing] = React.useState(false);
  const [parsedText, setParsedText] = React.useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = React.useState<string[]>([]);
  const [tagList, setTagList] = React.useState<string[]>([]);
  const [isAutoTagged, setIsAutoTagged] = React.useState(false);
  const [showTags, setShowTags] = React.useState(false);

  // Auto-tag rate limiting state
  const [isAutoTagging, setIsAutoTagging] = React.useState(false);
  const [autoTagCooldown, setAutoTagCooldown] = React.useState(0);

  // Abort controller for canceling uploads
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const createPaperMutation = useCreatePaper({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
        toast.success('Paper created successfully');
      },
      onError: () => {
        toast.error('Failed to create paper');
      },
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setFile(undefined);
    setParsedText(null);
    setSuggestedTags([]);
    setTagList([]);
    setIsAutoTagged(false);
    setShowTags(false);
  };

  const handleFileChange = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    setFile(selectedFile);
    setSuggestedTags([]);
    setTagList([]);
    setIsAutoTagged(false);
    setShowTags(false);
    setIsParsing(true);

    try {
      const response = await parsePaperFile(
        selectedFile,
        undefined,
        abortControllerRef.current.signal,
      );
      console.log('Parse response:', response);
      setParsedText(response.parsedText || null);
    } catch (error) {
      console.error('Parse error:', error);

      // Check if the error was due to user cancellation
      if (
        (error as any)?.name === 'CanceledError' ||
        (error as any)?.code === 'ERR_CANCELED'
      ) {
        toast.info('Upload cancelled');
      } else {
        // Reset file and parsing state on error
        setFile(undefined);
        setParsedText(null);

        if (
          (error as any)?.code === 'ECONNABORTED' ||
          (error as any)?.response?.status === 504
        ) {
          toast.error(
            'PDF parsing timed out. The file may be too large or complex. Please try a smaller file.',
          );
        } else {
          toast.error('Failed to parse the PDF file');
        }
      }
    } finally {
      setIsParsing(false);
      abortControllerRef.current = null;
    }
  };

  // Auto-tag cooldown timer
  React.useEffect(() => {
    if (autoTagCooldown <= 0) return;

    const timer = setInterval(() => {
      setAutoTagCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [autoTagCooldown]);

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    handleRemoveFile();
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    setParsedText(null);
    setSuggestedTags([]);
    setTagList([]);
    setIsAutoTagged(false);
    setShowTags(false);
  };

  const handleAutoTag = async () => {
    if (!file || !parsedText) {
      toast.warning('Please wait for the PDF to finish parsing first');
      return;
    }

    if (autoTagCooldown > 0) {
      toast.warning(
        `Please wait ${autoTagCooldown} seconds before trying again`,
      );
      return;
    }

    setIsAutoTagging(true);

    try {
      const response = await autoTagPaper({
        parsedText: parsedText,
        existingTags: tagList,
      });

      const suggestedTagsList = response.tags || [];
      setSuggestedTags(suggestedTagsList);

      // Merge suggested tags with existing tags (avoiding duplicates)
      setTagList((prev) => {
        const merged = [...prev];
        suggestedTagsList.forEach((tag) => {
          const normalizedTag = tag.trim();
          if (
            normalizedTag &&
            !merged.some((t) => t.toLowerCase() === normalizedTag.toLowerCase())
          ) {
            merged.push(normalizedTag);
          }
        });
        return merged;
      });

      setIsAutoTagged(true);
      setShowTags(true);
      setAutoTagCooldown(60); // 60 seconds cooldown
      toast.success(`Added ${suggestedTagsList.length} suggested tags`);
    } catch (error) {
      console.error('Auto-tag error:', error);
      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Failed to auto-tag paper';
      toast.error(errorMessage);
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handleAddTag = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !tagList.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setTagList((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
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
      parsedText: parsedText || '',
      tagNames: tagList,
      isAutoTagged,
      isIngested: false,
      status: formData.status,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className={BTN.CREATE}>
          <Plus className="size-4" />
          Create Paper
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-sm">
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
                    onClick={isParsing ? handleCancelUpload : handleRemoveFile}
                    title={isParsing ? 'Cancel upload' : 'Remove file'}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {/* Parsing loading state */}
                {isParsing && (
                  <div className="bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="size-3 animate-spin" />
                        Parsing PDF...
                      </span>
                    </div>
                    <div className="flex items-center gap-1" aria-hidden="true">
                      <span className="bg-primary/50 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                      <span className="bg-primary/50 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                      <span className="bg-primary/50 size-1.5 animate-bounce rounded-full" />
                    </div>
                  </div>
                )}
                {!isParsing && parsedText && (
                  <p className="text-muted-foreground text-xs">
                    ✓ PDF parsed successfully
                  </p>
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

          {/* Tags editor - always visible */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tags {tagList.length > 0 && `(${tagList.length})`}
            </label>
            <TagAutocompleteInput
              tagList={tagList}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              placeholder="Type a tag and press Enter..."
            />
            {/* Auto Tag button */}
            {file && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 ${BTN.AUTO_TAG}`}
                  onClick={handleAutoTag}
                  disabled={
                    isAutoTagging ||
                    autoTagCooldown > 0 ||
                    isParsing ||
                    !parsedText
                  }
                >
                  {isAutoTagging ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Tags className="size-4" />
                  )}
                  {isAutoTagging
                    ? 'Auto Tagging...'
                    : autoTagCooldown > 0
                      ? `Wait ${autoTagCooldown}s`
                      : 'Auto Tag'}
                </Button>
              </div>
            )}
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
            <label
              htmlFor="create-paper-status"
              className="text-sm font-medium"
            >
              Status
            </label>
            <select
              id="create-paper-status"
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
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
