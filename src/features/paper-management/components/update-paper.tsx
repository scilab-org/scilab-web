import { Loader2, Tags } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useUpdatePaper } from '../api/update-paper';
import { autoTagPaper } from '../api/auto-tag-paper';
import { PaperDto } from '../types';
import { PAPER_STATUS_OPTIONS } from '../constants';
import { TagAutocompleteInput } from './tag-autocomplete-input';

type UpdatePaperProps = {
  paperId: string;
  paper: PaperDto;
};

const BIBTEX_MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const getCitationKey = (authors: string, year: string) => {
  // Normalize separators only for key extraction, not for author field storage.
  const normalizedAuthors = authors.replace(/\s+and\s+/gi, ', ');
  const firstAuthorToken = normalizedAuthors
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);
  const authorToken = (firstAuthorToken || 'Paper')
    .replace(/[^A-Za-z0-9]+/g, '')
    .replace(/^([0-9])/, 'Paper$1');

  return `${authorToken || 'Paper'}${year.trim()}`;
};

const buildReferenceContent = (params: {
  authors: string;
  title: string;
  doi: string;
  publisher: string;
  number: string;
  journalName: string;
  pages: string;
  volume: string;
  publicationYear: string;
  publicationMonth: string;
}) => {
  const wrap = (value: string) => (value.trim() ? `{${value.trim()}}` : '{}');
  const monthIndex = Number(params.publicationMonth) - 1;
  const month =
    monthIndex >= 0 && monthIndex < BIBTEX_MONTHS.length
      ? BIBTEX_MONTHS[monthIndex]
      : '';
  const key = getCitationKey(params.authors, params.publicationYear);
  const fields: string[] = [];
  if (params.authors.trim())
    fields.push(`  author    = ${wrap(params.authors)},`);
  if (params.title.trim()) fields.push(`  title     = ${wrap(params.title)},`);
  if (params.journalName.trim())
    fields.push(`  journal   = ${wrap(params.journalName)},`);
  if (params.publicationYear.trim())
    fields.push(`  year      = ${wrap(params.publicationYear)},`);
  if (month) fields.push(`  month     = ${month},`);
  if (params.volume.trim())
    fields.push(`  volume    = ${wrap(params.volume)},`);
  if (params.number.trim())
    fields.push(`  number    = ${wrap(params.number)},`);
  if (params.pages.trim()) fields.push(`  pages     = ${wrap(params.pages)},`);
  if (params.publisher.trim())
    fields.push(`  publisher = ${wrap(params.publisher)},`);
  if (params.doi.trim()) fields.push(`  doi       = ${wrap(params.doi)}`);

  return [`@article{${key || 'Paper'},`, ...fields, '}'].join('\n');
};

export const UpdatePaper = ({ paperId, paper }: UpdatePaperProps) => {
  const [open, setOpen] = React.useState(false);
  const initialPublicationDate = paper?.publicationDate
    ? paper.publicationDate.split('T')[0]
    : '';
  const initialDateParts = initialPublicationDate
    ? initialPublicationDate.split('-')
    : [];
  const [formData, setFormData] = React.useState({
    title: paper?.title || '',
    abstract: paper?.abstract || '',
    doi: paper?.doi || '',
    authors: paper?.authors || '',
    publisher: paper?.publisher || '',
    number: paper?.number || '',
    pages: paper?.pages || '',
    volume: paper?.volume || '',
    paperType: paper?.paperType || '',
    journalName: paper?.journalName || '',
    conferenceName: paper?.conferenceName || '',
    status: paper?.status || 1,
  });
  const [pubYear, setPubYear] = React.useState(initialDateParts[0] || '');
  const [pubMonth, setPubMonth] = React.useState(
    initialDateParts[1] && initialDateParts[1] !== '01'
      ? initialDateParts[1]
      : '',
  );
  const [pubDay, setPubDay] = React.useState(
    initialDateParts[2] && initialDateParts[2] !== '01'
      ? initialDateParts[2]
      : '',
  );
  const [pubYearError, setPubYearError] = React.useState('');
  const [journalConferenceError, setJournalConferenceError] =
    React.useState('');
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

  const parsedYear = Number.parseInt(pubYear, 10);
  const parsedMonth = Number.parseInt(pubMonth, 10);
  const maxDay =
    Number.isInteger(parsedYear) &&
    parsedYear >= 1000 &&
    parsedYear <= new Date().getFullYear() &&
    Number.isInteger(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12
      ? new Date(parsedYear, parsedMonth, 0).getDate()
      : 31;

  React.useEffect(() => {
    if (!pubDay) return;
    if (Number.parseInt(pubDay, 10) > maxDay) {
      setPubDay('');
    }
  }, [pubDay, maxDay]);

  React.useEffect(() => {
    if (open && paper) {
      const publicationDate = paper.publicationDate
        ? paper.publicationDate.split('T')[0]
        : '';
      const dateParts = publicationDate ? publicationDate.split('-') : [];
      setFormData({
        title: paper.title || '',
        abstract: paper.abstract || '',
        doi: paper.doi || '',
        authors: paper.authors || '',
        publisher: paper.publisher || '',
        number: paper.number || '',
        pages: paper.pages || '',
        volume: paper.volume || '',
        paperType: paper.paperType || '',
        journalName: paper.journalName || '',
        conferenceName: paper.conferenceName || '',
        status: paper.status || 1,
      });
      setPubYear(dateParts[0] || '');
      setPubMonth(dateParts[1] && dateParts[1] !== '01' ? dateParts[1] : '');
      setPubDay(dateParts[2] && dateParts[2] !== '01' ? dateParts[2] : '');
      setPubYearError('');
      setJournalConferenceError('');
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
    if (!formData.authors.trim()) {
      toast.error('Authors is required.');
      return;
    }
    const hasJournalName = formData.journalName.trim().length > 0;
    const hasConferenceName = formData.conferenceName.trim().length > 0;
    if (hasJournalName && hasConferenceName) {
      setJournalConferenceError(
        'Please fill either Journal Name or Conference Name, not both.',
      );
      return;
    }

    if (!pubYear.trim()) {
      setPubYearError('Publication year is required.');
      return;
    }
    const year = parseInt(pubYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1000 || year > currentYear) {
      setPubYearError(`Year must be between 1000 and ${currentYear}.`);
      return;
    }
    const yStr = pubYear.padStart(4, '0');
    const mStr = pubMonth ? pubMonth.padStart(2, '0') : '01';
    const dStr = pubDay ? pubDay.padStart(2, '0') : '01';
    const composedDate = `${yStr}-${mStr}-${dStr}`;
    if (new Date(composedDate) > new Date()) {
      setPubYearError('Publication date cannot be in the future.');
      return;
    }
    updatePaperMutation.mutate({
      paperId,
      data: {
        title: formData.title,
        abstract: formData.abstract,
        doi: formData.doi,
        authors: formData.authors,
        publisher: formData.publisher,
        number: formData.number,
        pages: formData.pages,
        volume: formData.volume,
        publicationDate: composedDate,
        paperType: formData.paperType,
        journalName: formData.journalName,
        conferenceName: formData.conferenceName,
        referenceContent: buildReferenceContent({
          authors: formData.authors,
          title: formData.title,
          doi: formData.doi,
          publisher: formData.publisher,
          number: formData.number,
          journalName: formData.journalName,
          pages: formData.pages,
          volume: formData.volume,
          publicationYear: pubYear,
          publicationMonth: pubMonth,
        }),
        status: formData.status,
        tagNames: tagList,
        isAutoTagged,
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
          <DialogTitle>Edit Paper</DialogTitle>
          <DialogDescription>
            Update information for &quot;{paper.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <form
          id="update-paper-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex flex-1 flex-col gap-4 overflow-y-auto px-4"
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
                  className="h-7 gap-1 text-xs"
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
              htmlFor="update-paper-authors"
              className="text-sm font-medium"
            >
              Authors <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-paper-authors"
              value={formData.authors}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, authors: e.target.value }))
              }
              placeholder="Enter authors"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-publisher"
              className="text-sm font-medium"
            >
              Publisher
            </label>
            <Input
              id="update-paper-publisher"
              value={formData.publisher}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  publisher: e.target.value,
                }))
              }
              placeholder="Enter publisher"
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
            <label
              htmlFor="update-paper-pubyear"
              className="text-sm font-medium"
            >
              Publication Date <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                id="update-paper-pubyear"
                type="number"
                min="1000"
                max={new Date().getFullYear()}
                placeholder="YYYY"
                value={pubYear}
                className="h-10 min-w-0 text-sm"
                onChange={(e) => {
                  setPubYear(e.target.value);
                  setPubYearError('');
                }}
              />
              <select
                value={pubMonth}
                onChange={(e) => {
                  setPubMonth(e.target.value);
                  setPubYearError('');
                }}
                className={cn(
                  'border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full min-w-0 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  !pubMonth && 'text-muted-foreground',
                )}
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => (
                    <option key={month} value={String(month).padStart(2, '0')}>
                      {String(month).padStart(2, '0')}
                    </option>
                  ),
                )}
              </select>
              <select
                id="update-paper-pubday"
                value={pubDay}
                onChange={(e) => {
                  setPubDay(e.target.value);
                  setPubYearError('');
                }}
                className={cn(
                  'border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full min-w-0 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  !pubDay && 'text-muted-foreground',
                )}
              >
                <option value="">DD</option>
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d).padStart(2, '0')}>
                    {String(d).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            {pubYearError && (
              <p className="text-destructive text-xs">{pubYearError}</p>
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
                setFormData((prev) => {
                  if (journalConferenceError) setJournalConferenceError('');
                  return {
                    ...prev,
                    journalName: e.target.value,
                  };
                })
              }
              placeholder="Enter journal name"
              disabled={Boolean(formData.conferenceName.trim())}
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
                setFormData((prev) => {
                  if (journalConferenceError) setJournalConferenceError('');
                  return {
                    ...prev,
                    conferenceName: e.target.value,
                  };
                })
              }
              placeholder="Enter conference name"
              disabled={Boolean(formData.journalName.trim())}
            />
            {journalConferenceError && (
              <p className="text-destructive text-xs">
                {journalConferenceError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                htmlFor="update-paper-pages"
                className="text-sm font-medium"
              >
                Pages
              </label>
              <Input
                id="update-paper-pages"
                value={formData.pages}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pages: e.target.value }))
                }
                placeholder="Enter pages"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="update-paper-number"
                className="text-sm font-medium"
              >
                Number
              </label>
              <Input
                id="update-paper-number"
                value={formData.number}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, number: e.target.value }))
                }
                placeholder="Enter number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-volume"
              className="text-sm font-medium"
            >
              Volume
            </label>
            <Input
              id="update-paper-volume"
              value={formData.volume}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, volume: e.target.value }))
              }
              placeholder="Enter volume"
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

        <DialogFooter className="pt-2">
          <Button
            type="submit"
            form="update-paper-form"
            disabled={updatePaperMutation.isPending || !formData.authors.trim()}
            variant="darkRed"
          >
            {updatePaperMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
