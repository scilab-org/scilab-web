import { Loader2, Tags, Upload, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

import { useJournals } from '@/features/journal-management/api/get-journals';
import { useGapTypes } from '@/features/gap-type-management/api/get-gap-types';
import { findMatchingJournalId, parseBibTeXMetadata } from '../lib/bibtex';
import { useUpdatePaper } from '../api/update-paper';
import { autoTagPaper } from '../api/auto-tag-paper';
import { PaperDto } from '../types';
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

const BIBTEX_MONTH_TO_NUMBER: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

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
    ? paper.publicationDate.split(/T| /)[0]
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
    gapTypeIds: paper?.gapTypes?.map((gapType) => gapType.id) || [],
    gapTypeSearch: '',
    conferenceJournalId: '',
    ranking: paper?.ranking || '',
    url: paper?.url || '',
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
  const [pagesError, setPagesError] = React.useState('');
  const [keywordList, setKeywordList] = React.useState<
    { name: string; isFromPaper: boolean }[]
  >(paper?.keywords?.map((k) => ({ name: k, isFromPaper: false })) || []);
  const [isAutoTagging, setIsAutoTagging] = React.useState(false);
  const [isAutoTagged, setIsAutoTagged] = React.useState(
    paper?.isAutoTagged || false,
  );
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [bibFile, setBibFile] = React.useState<File | undefined>(undefined);
  const [bibReferenceContent, setBibReferenceContent] = React.useState('');
  const [pendingBibVenueName, setPendingBibVenueName] = React.useState('');
  const [lastAutoTagTime, setLastAutoTagTime] = React.useState<number | null>(
    () => {
      const stored = localStorage.getItem(`autoTagCooldown_${paperId}`);
      return stored ? parseInt(stored) : null;
    },
  );

  const journalsQuery = useJournals({ params: { PageSize: 1000 } });
  const journals = React.useMemo(
    () => journalsQuery.data?.result?.items ?? [],
    [journalsQuery.data?.result?.items],
  );
  const matchedExistingJournalId = React.useMemo(
    () => findMatchingJournalId(journals, paper.conferenceJournalName),
    [journals, paper.conferenceJournalName],
  );
  const gapTypeInputRef = React.useRef<HTMLInputElement | null>(null);
  const gapTypeComboboxRef = React.useRef<HTMLDivElement | null>(null);
  const [gapTypeSearch, setGapTypeSearch] = React.useState('');
  const [isGapTypeOpen, setIsGapTypeOpen] = React.useState(false);
  const gapTypesQuery = useGapTypes({
    params: { PageSize: 1000, PageNumber: 1 },
  });
  const gapTypes = React.useMemo(
    () => gapTypesQuery.data?.result?.items ?? [],
    [gapTypesQuery.data?.result?.items],
  );
  const selectedGapTypes = React.useMemo(
    () =>
      gapTypes.filter((gapType) => formData.gapTypeIds.includes(gapType.id)),
    [gapTypes, formData.gapTypeIds],
  );
  const filteredGapTypes = React.useMemo(() => {
    const query = gapTypeSearch.trim().toLowerCase();
    const available = gapTypes.filter(
      (gapType) => !formData.gapTypeIds.includes(gapType.id),
    );
    if (!query) return available;
    return available.filter((gapType) =>
      gapType.name.toLowerCase().includes(query),
    );
  }, [gapTypes, gapTypeSearch, formData.gapTypeIds]);

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
        ? paper.publicationDate.split(/T| /)[0]
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
        gapTypeIds: paper.gapTypes?.map((gapType) => gapType.id) || [],
        gapTypeSearch: '',
        conferenceJournalId: matchedExistingJournalId || '',
        ranking: paper.ranking || '',
        url: paper.url || '',
      });
      setPubYear(dateParts[0] || '');
      setPubMonth(dateParts[1] && dateParts[1] !== '01' ? dateParts[1] : '');
      setPubDay(dateParts[2] && dateParts[2] !== '01' ? dateParts[2] : '');
      setPubYearError('');
      setPagesError('');
      setKeywordList(
        paper.keywords?.map((k) => ({ name: k, isFromPaper: false })) || [],
      );
      setIsAutoTagging(false);
      setIsAutoTagged(paper.isAutoTagged || false);
      setBibFile(undefined);
      setBibReferenceContent('');
      setPendingBibVenueName('');

      // Calculate cooldown based on stored timestamp
      if (lastAutoTagTime) {
        const elapsed = Math.floor((Date.now() - lastAutoTagTime) / 1000);
        const remaining = Math.max(0, 180 - elapsed);
        setCooldownSeconds(remaining);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedExistingJournalId, open]);

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

  const handleRemoveBibFile = () => {
    setBibFile(undefined);
    setBibReferenceContent('');
    setPendingBibVenueName('');
  };

  const handleBibFileChange = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    try {
      const rawContent = await selectedFile.text();
      const parsedBib = parseBibTeXMetadata(rawContent);

      setBibFile(selectedFile);
      setBibReferenceContent(rawContent.trim());

      if (!parsedBib) {
        toast.warning(
          'BibTeX file was attached, but its fields could not be parsed.',
        );
        return;
      }

      const matchedJournalId = findMatchingJournalId(
        journals,
        parsedBib.journalName,
      );
      setPendingBibVenueName(parsedBib.journalName || '');

      setFormData((prev) => ({
        ...prev,
        title: parsedBib.title || prev.title,
        abstract: parsedBib.abstract || prev.abstract,
        doi: parsedBib.doi || prev.doi,
        authors: parsedBib.authors || prev.authors,
        publisher: parsedBib.publisher || prev.publisher,
        number: parsedBib.number || prev.number,
        pages: parsedBib.pages || prev.pages,
        volume: parsedBib.volume || prev.volume,
        conferenceJournalId: matchedJournalId || prev.conferenceJournalId,
        ranking: parsedBib.ranking || prev.ranking,
        url: parsedBib.url || prev.url,
      }));

      if (parsedBib.year) {
        setPubYear(parsedBib.year);
        setPubYearError('');
      }

      if (parsedBib.month) {
        const normalizedMonth = parsedBib.month.trim().toLowerCase();
        setPubMonth(
          BIBTEX_MONTH_TO_NUMBER[normalizedMonth] ||
            normalizedMonth.padStart(2, '0'),
        );
      }

      toast.success('Filled fields from BibTeX file');
    } catch {
      toast.error('Failed to read BibTeX file');
    }
  };

  React.useEffect(() => {
    if (
      !pendingBibVenueName ||
      !journals.length ||
      formData.conferenceJournalId
    ) {
      return;
    }

    const matchedJournalId = findMatchingJournalId(
      journals,
      pendingBibVenueName,
    );
    if (!matchedJournalId) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      conferenceJournalId: prev.conferenceJournalId || matchedJournalId,
    }));
  }, [formData.conferenceJournalId, journals, pendingBibVenueName]);

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
        parsedText: currentParsedText!,
        existingTags: keywordList.map((t) => t.name),
      });

      const suggestedTagsList = response.tags || [];

      // Merge suggested keywords with existing ones (avoiding duplicates)
      setKeywordList((prev) => {
        const merged = [...prev];
        suggestedTagsList.forEach((tag) => {
          const normalizedName = tag.name.trim();
          if (
            normalizedName &&
            !merged.some(
              (t) => t.name.toLowerCase() === normalizedName.toLowerCase(),
            )
          ) {
            merged.push({ name: normalizedName, isFromPaper: tag.isFromPaper });
          }
        });
        return merged;
      });

      setIsAutoTagged(true);
      const now = Date.now();
      setLastAutoTagTime(now);
      localStorage.setItem(`autoTagCooldown_${paperId}`, now.toString());
      setCooldownSeconds(180);
      toast.success(`Added ${suggestedTagsList.length} suggested keywords`);
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

  const handleAddKeyword = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !keywordList.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setKeywordList((prev) => [...prev, { name: trimmed, isFromPaper: false }]);
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywordList((prev) => prev.filter((t) => t.name !== kw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.authors.trim()) {
      toast.error('Authors is required.');
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

    const selectedJournal = journals.find(
      (j) => j.id === formData.conferenceJournalId,
    );
    const journalNameForRef = selectedJournal?.name ?? '';

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
        gapTypeIds: formData.gapTypeIds,
        conferenceJournalId: formData.conferenceJournalId || undefined,
        ranking: formData.ranking || undefined,
        url: formData.url || undefined,
        bibFile,
        referenceContent:
          bibReferenceContent ||
          buildReferenceContent({
            authors: formData.authors,
            title: formData.title,
            doi: formData.doi,
            publisher: formData.publisher,
            number: formData.number,
            journalName: journalNameForRef,
            pages: formData.pages,
            volume: formData.volume,
            publicationYear: pubYear,
            publicationMonth: pubMonth,
          }),
        keywords: keywordList.map((k) => k.name),
        isAutoTagged,
        isIngested: paper.isIngested,
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
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Paper</DialogTitle>
            <DialogDescription>
              Update information for &quot;{paper.title}&quot;
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          id="update-paper-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-6 py-4"
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
              placeholder="e.g. Attention Is All You Need"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="update-paper-bib" className="text-sm font-medium">
              BibTeX File
            </label>
            {bibFile ? (
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Upload className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{bibFile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {(bibFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  onClick={handleRemoveBibFile}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="update-paper-bib"
                className="border-input hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors"
              >
                <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
                  <Upload className="size-4" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload BibTeX</p>
                  <p className="text-muted-foreground text-xs">
                    .bib files only
                  </p>
                </div>
                <input
                  id="update-paper-bib"
                  type="file"
                  accept=".bib"
                  className="hidden"
                  onChange={(e) => handleBibFileChange(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Keywords {keywordList.length > 0 && `(${keywordList.length})`}
              </label>
              {paper?.parsedText && (
                <Button
                  type="button"
                  variant="darkRed"
                  size="action"
                  onClick={handleAutoTag}
                  disabled={isAutoTagging || cooldownSeconds > 0}
                  className="gap-1 uppercase"
                >
                  {isAutoTagging ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Suggesting...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <Tags className="size-3" />
                      {`${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')}`}
                    </>
                  ) : (
                    <>
                      <Tags className="size-3" />
                      Suggest Keywords
                    </>
                  )}
                </Button>
              )}
            </div>
            <TagAutocompleteInput
              key={`${paperId}-${open}`}
              tagList={keywordList.map((t) => t.name)}
              onAddTag={handleAddKeyword}
              onRemoveTag={handleRemoveKeyword}
              suggestedTags={keywordList
                .filter((t) => t.isFromPaper)
                .map((t) => t.name)}
              placeholder="Type a keyword and press Enter..."
              className="dark:bg-input/30 bg-transparent"
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
              placeholder="e.g. 10.1000/xyz123"
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
              placeholder="e.g. LeCun, Yann and Bengio, Yoshua"
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
              placeholder="e.g. Nature Publishing Group"
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
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="e.g. The effects of..."
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
                  'border-input dark:bg-input/30 ring-offset-background focus-visible:ring-ring h-10 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
                  'border-input dark:bg-input/30 ring-offset-background focus-visible:ring-ring h-10 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
            <label
              htmlFor="update-paper-gap-type"
              className="text-sm font-medium"
            >
              Gap Types
            </label>
            <div ref={gapTypeComboboxRef} className="relative">
              <div
                role="combobox"
                tabIndex={0}
                aria-expanded={isGapTypeOpen}
                aria-controls="update-paper-gap-types-listbox"
                className={cn(
                  'border-input text-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]',
                )}
                onClick={() => gapTypeInputRef.current?.focus()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    gapTypeInputRef.current?.focus();
                  }
                }}
              >
                {selectedGapTypes.map((gapType) => (
                  <Badge
                    key={gapType.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
                  >
                    {gapType.name}
                    <button
                      type="button"
                      className="text-white/80 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormData((prev) => ({
                          ...prev,
                          gapTypeIds: prev.gapTypeIds.filter(
                            (id) => id !== gapType.id,
                          ),
                        }));
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={gapTypeInputRef}
                  value={gapTypeSearch}
                  onFocus={() => setIsGapTypeOpen(true)}
                  onChange={(e) => {
                    setGapTypeSearch(e.target.value);
                    setIsGapTypeOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      setIsGapTypeOpen(true);
                    }
                    if (e.key === 'Escape') {
                      setIsGapTypeOpen(false);
                    }
                    if (
                      e.key === 'Backspace' &&
                      !gapTypeSearch &&
                      selectedGapTypes.length > 0
                    ) {
                      setFormData((prev) => ({
                        ...prev,
                        gapTypeIds: prev.gapTypeIds.slice(0, -1),
                      }));
                    }
                  }}
                  placeholder={
                    gapTypeSearch.trim()
                      ? ''
                      : selectedGapTypes.length > 0
                        ? 'Add more gap types...'
                        : 'Search gap types...'
                  }
                  autoComplete="off"
                  className={cn(
                    'flex h-5 min-w-24 flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0',
                    gapTypeSearch.trim() || selectedGapTypes.length > 0
                      ? 'placeholder:text-transparent'
                      : 'placeholder:text-muted-foreground/50',
                  )}
                />
              </div>
              {isGapTypeOpen && (
                <div
                  id="update-paper-gap-types-listbox"
                  role="listbox"
                  className="bg-background absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-sm"
                >
                  {filteredGapTypes.length > 0 ? (
                    filteredGapTypes.map((gapType) => (
                      <button
                        key={gapType.id}
                        type="button"
                        className="hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            gapTypeIds: [...prev.gapTypeIds, gapType.id],
                          }));
                          setGapTypeSearch('');
                          setIsGapTypeOpen(false);
                        }}
                      >
                        <span>{gapType.name}</span>
                        <X className="size-4 opacity-0" />
                      </button>
                    ))
                  ) : (
                    <div className="text-muted-foreground px-3 py-2 text-xs">
                      No gap types found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-journal"
              className="text-sm font-medium"
            >
              Journal / Conference
            </label>
            <select
              id="update-paper-journal"
              value={formData.conferenceJournalId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conferenceJournalId: e.target.value,
                }))
              }
              className={cn(
                'border-input dark:bg-input/30 ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border bg-transparent px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                !formData.conferenceJournalId && 'text-muted-foreground',
              )}
            >
              <option value="">Select journal / conference</option>
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-paper-ranking"
              className="text-sm font-medium"
            >
              Ranking
            </label>
            <Input
              id="update-paper-ranking"
              value={formData.ranking}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ranking: e.target.value }))
              }
              placeholder="e.g. Q1, A*"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="update-paper-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="update-paper-url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="e.g. https://arxiv.org/abs/..."
            />
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
                onChange={(e) => {
                  if (pagesError) setPagesError('');
                  setFormData((prev) => ({ ...prev, pages: e.target.value }));
                }}
                placeholder="e.g. 436--444"
              />
              {pagesError && (
                <p className="text-destructive text-xs">{pagesError}</p>
              )}
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
                placeholder="e.g. 7553"
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
              placeholder="e.g. 521"
            />
          </div>
        </form>

        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter>
            <Button
              type="submit"
              form="update-paper-form"
              disabled={
                updatePaperMutation.isPending || !formData.authors.trim()
              }
              variant="darkRed"
            >
              {updatePaperMutation.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
