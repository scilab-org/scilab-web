import * as React from 'react';
import { Pencil, Tags, Loader2 } from 'lucide-react';
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

import { useUpdatePaper } from '../api/update-paper';
import { autoTagPaper } from '../api/auto-tag-paper';
import { PaperDto } from '../types';
import { PAPER_STATUS_OPTIONS } from '../constants';
import { TagAutocompleteInput } from './tag-autocomplete-input';
import { BTN } from '@/lib/button-styles';

type UpdatePaperProps = {
  paperId: string;
  paper: PaperDto;
};

export const UpdatePaper = ({ paperId, paper }: UpdatePaperProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: paper?.title || '',
    abstract: paper?.abstract || '',
    doi: paper?.doi || '',
    publicationDate: paper?.publicationDate
      ? new Date(paper.publicationDate).toISOString().slice(0, 16)
      : '',
    paperType: paper?.paperType || '',
    journalName: paper?.journalName || '',
    conferenceName: paper?.conferenceName || '',
    status: paper?.status || 1,
  });
  const [tagList, setTagList] = React.useState<string[]>(paper?.tagNames || []);
  const [isAutoTagging, setIsAutoTagging] = React.useState(false);
  const [isAutoTagged, setIsAutoTagged] = React.useState(
    paper?.isAutoTagged || false,
  );
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [lastAutoTagTime, setLastAutoTagTime] = React.useState<number | null>(
    () => {
      const stored = localStorage.getItem(`autoTagCooldown_${paperId}`);
      return stored ? parseInt(stored) : null;
    },
  );

  const updatePaperMutation = useUpdatePaper({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Paper updated successfully');
      },
      onError: () => {
        toast.error('Failed to update paper');
      },
    },
  });

  React.useEffect(() => {
    if (open && paper) {
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
        status: paper.status || 1,
      });
      setTagList(paper.tagNames || []);
      setIsAutoTagging(false);
      setIsAutoTagged(paper.isAutoTagged || false);

      // Calculate cooldown based on stored timestamp
      if (lastAutoTagTime) {
        const elapsed = Math.floor((Date.now() - lastAutoTagTime) / 1000);
        const remaining = Math.max(0, 180 - elapsed);
        setCooldownSeconds(remaining);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Countdown timer
  React.useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownSeconds === 0 && lastAutoTagTime) {
      localStorage.removeItem(`autoTagCooldown_${paperId}`);
    }
  }, [cooldownSeconds, lastAutoTagTime, paperId]);

  const handleAutoTag = async () => {
    if (!paper) return;
    const currentParsedText = paper.parsedText;
    if (!currentParsedText) {
      toast.warning('No parsed text available for auto-tagging');
      return;
    }

    if (cooldownSeconds > 0) {
      toast.warning(
        `Please wait ${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')} before trying again`,
      );
      return;
    }

    setIsAutoTagging(true);

    try {
      const response = await autoTagPaper({
        parsedText: currentParsedText,
        existingTags: tagList,
      });

      const suggestedTagsList = response.tags || [];

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
      const now = Date.now();
      setLastAutoTagTime(now);
      localStorage.setItem(`autoTagCooldown_${paperId}`, now.toString());
      setCooldownSeconds(180);
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
      <SheetContent side="right" className="overflow-y-auto sm:max-w-sm">
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
              {paper?.parsedText && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoTag}
                  disabled={isAutoTagging || cooldownSeconds > 0}
                  className={`h-7 gap-1 text-xs ${BTN.AUTO_TAG}`}
                >
                  {isAutoTagging ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Tagging...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <Tags className="size-3" />
                      {`${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')}`}
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
            <TagAutocompleteInput
              key={`${paperId}-${open}`}
              tagList={tagList}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              placeholder="Type a tag and press Enter..."
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
