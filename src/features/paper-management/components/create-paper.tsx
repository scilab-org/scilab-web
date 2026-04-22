import * as React from 'react';
import { Upload, X, Tags, Loader2 } from 'lucide-react';
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

import { CreateButton } from '@/components/ui/create-button';
import { useJournals } from '@/features/journal-management/api/get-journals';
import { findMatchingJournalId, parseBibTeXMetadata } from '../lib/bibtex';
import { useCreatePaper } from '../api/create-paper';
import { parsePaperFile } from '../api/parse-paper';
import { autoTagPaper } from '../api/auto-tag-paper';
import { TagAutocompleteInput } from './tag-autocomplete-input';

const initialFormData = {
  title: '',
  abstract: '',
  doi: '',
  authors: '',
  publisher: '',
  number: '',
  paperType: '',
  conferenceJournalId: '',
  pages: '',
  volume: '',
  ranking: '',
  url: '',
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
  if (params.authors.trim()) {
    fields.push(`  author    = ${wrap(params.authors)},`);
  }
  if (params.title.trim()) {
    fields.push(`  title     = ${wrap(params.title)},`);
  }
  if (params.journalName.trim()) {
    fields.push(`  journal   = ${wrap(params.journalName)},`);
  }
  if (params.publicationYear.trim()) {
    fields.push(`  year      = ${wrap(params.publicationYear)},`);
  }
  if (month) {
    fields.push(`  month     = ${month},`);
  }
  if (params.volume.trim()) {
    fields.push(`  volume    = ${wrap(params.volume)},`);
  }
  if (params.number.trim()) {
    fields.push(`  number    = ${wrap(params.number)},`);
  }
  if (params.pages.trim()) {
    fields.push(`  pages     = ${wrap(params.pages)},`);
  }
  if (params.publisher.trim()) {
    fields.push(`  publisher = ${wrap(params.publisher)},`);
  }
  if (params.doi.trim()) {
    fields.push(`  doi       = ${wrap(params.doi)}`);
  }

  return [`@article{${key || 'Paper'},`, ...fields, '}'].join('\n');
};

export const CreatePaper = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [pdfFile, setPdfFile] = React.useState<File | undefined>(undefined);
  const [bibFile, setBibFile] = React.useState<File | undefined>(undefined);
  const [bibReferenceContent, setBibReferenceContent] = React.useState('');
  const [pendingBibVenueName, setPendingBibVenueName] = React.useState('');

  // Publication date parts (year required, month/day optional)
  const [pubYear, setPubYear] = React.useState('');
  const [pubMonth, setPubMonth] = React.useState('');
  const [pubDay, setPubDay] = React.useState('');
  const [pubYearError, setPubYearError] = React.useState('');
  const [pagesError, setPagesError] = React.useState('');

  // Parse state
  const [isParsing, setIsParsing] = React.useState(false);
  const [parsedText, setParsedText] = React.useState<string | null>(null);
  const [keywordList, setKeywordList] = React.useState<string[]>([]);
  const [isAutoTagged, setIsAutoTagged] = React.useState(false);

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
    setPdfFile(undefined);
    setBibFile(undefined);
    setBibReferenceContent('');
    setPendingBibVenueName('');
    setParsedText(null);
    setKeywordList([]);
    setIsAutoTagged(false);
    setAutoTagCooldown(0);
    setPubYear('');
    setPubMonth('');
    setPubDay('');
    setPubYearError('');
    setPagesError('');
  };

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

  const handlePdfFileChange = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    setPdfFile(selectedFile);
    setKeywordList([]);
    setIsAutoTagged(false);
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
        // Keep the file so the form can still be tested without parsed text.
        setParsedText('');

        if (
          (error as any)?.code === 'ECONNABORTED' ||
          (error as any)?.response?.status === 504
        ) {
          toast.error(
            'PDF parsing timed out. Continuing without parsed text for local testing.',
          );
        } else {
          toast.warning(
            'PDF parsing is unavailable. Continuing without parsed text.',
          );
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
    handleRemovePdfFile();
  };

  const handleRemovePdfFile = () => {
    setPdfFile(undefined);
    setParsedText(null);
    setKeywordList([]);
    setIsAutoTagged(false);
  };

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

  const handleAutoTag = async () => {
    if (!pdfFile || !parsedText) {
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
        existingTags: keywordList,
      });

      const suggestedTagsList = response.tags || [];

      // Merge suggested keywords with existing ones (avoiding duplicates)
      setKeywordList((prev) => {
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

  const handleAddKeyword = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !keywordList.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setKeywordList((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywordList((prev) => prev.filter((t) => t !== kw));
  };

  const journalsQuery = useJournals({ params: { PageSize: 1000 } });
  const journals = React.useMemo(
    () => journalsQuery.data?.result?.items ?? [],
    [journalsQuery.data?.result?.items],
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.authors.trim() || !pdfFile) return;

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

    createPaperMutation.mutate({
      title: formData.title,
      abstract: formData.abstract,
      doi: formData.doi,
      authors: formData.authors,
      publisher: formData.publisher,
      number: formData.number,
      publicationDate: composedDate,
      paperType: formData.paperType,
      conferenceJournalId: formData.conferenceJournalId || undefined,
      pages: formData.pages,
      volume: formData.volume,
      ranking: formData.ranking || undefined,
      url: formData.url || undefined,
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
      pdfFile,
      bibFile,
      parsedText: parsedText || '',
      keywords: keywordList,
      isAutoTagged,
      isIngested: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CreateButton className="uppercase">ADD PAPER</CreateButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Add Paper</DialogTitle>
            <DialogDescription>
              Upload a PDF file and fill in the details.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          id="create-paper-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          {/* File upload - required, placed first */}
          <div className="space-y-1.5">
            <label htmlFor="create-paper-file" className="text-sm font-medium">
              PDF File <span className="text-destructive">*</span>
            </label>
            {pdfFile ? (
              <div className="space-y-3">
                <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                    <Upload className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {pdfFile.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(pdfFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                    onClick={
                      isParsing ? handleCancelUpload : handleRemovePdfFile
                    }
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
                  onChange={(e) => handlePdfFileChange(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-bibfile"
              className="text-sm font-medium"
            >
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
                  title="Remove file"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="create-paper-bibfile"
                className="border-input hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors"
              >
                <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
                  <Upload className="size-4" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload .bib</p>
                  <p className="text-muted-foreground text-xs">
                    BibTeX files only
                  </p>
                </div>
                <input
                  id="create-paper-bibfile"
                  type="file"
                  accept=".bib"
                  className="hidden"
                  onChange={(e) => handleBibFileChange(e.target.files?.[0])}
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

          {/* Keywords editor - always visible */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Keywords {keywordList.length > 0 && `(${keywordList.length})`}
            </label>
            <TagAutocompleteInput
              tagList={keywordList}
              onAddTag={handleAddKeyword}
              onRemoveTag={handleRemoveKeyword}
              placeholder="Type a keyword and press Enter..."
              className="dark:bg-input/30 bg-transparent"
            />
            {/* Auto Tag button */}
            {pdfFile && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="darkRed"
                  size="action"
                  className="gap-1 uppercase"
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
              htmlFor="create-paper-authors"
              className="text-sm font-medium"
            >
              Authors <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-paper-authors"
              value={formData.authors}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, authors: e.target.value }))
              }
              placeholder="e.g. LeCun, Yann and Bengio, Yoshua"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-publisher"
              className="text-sm font-medium"
            >
              Publisher
            </label>
            <Input
              id="create-paper-publisher"
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

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-abstract"
              className="text-sm font-medium"
            >
              Abstract
            </label>
            <textarea
              id="create-paper-abstract"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="e.g. The effects of..."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-pubyear"
              className="text-sm font-medium"
            >
              Publication Date <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                id="create-paper-pubyear"
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
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m).padStart(2, '0')}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                id="create-paper-pubday"
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

          <div className="space-y-1.5">
            <label htmlFor="create-paper-type" className="text-sm font-medium">
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

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-journal"
              className="text-sm font-medium"
            >
              Conference / Journal
            </label>
            <select
              id="create-paper-journal"
              value={formData.conferenceJournalId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conferenceJournalId: e.target.value,
                }))
              }
              className={cn(
                'border-input dark:bg-input/30 ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                !formData.conferenceJournalId && 'text-muted-foreground',
              )}
            >
              <option value="">Select conference / journal...</option>
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-ranking"
              className="text-sm font-medium"
            >
              Ranking
            </label>
            <Input
              id="create-paper-ranking"
              value={formData.ranking}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ranking: e.target.value }))
              }
              placeholder="e.g. Q1, A*"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-paper-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="create-paper-url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="e.g. https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="create-paper-pages"
                className="text-sm font-medium"
              >
                Pages
              </label>
              <Input
                id="create-paper-pages"
                value={formData.pages}
                onChange={(e) => {
                  if (pagesError) setPagesError('');
                  setFormData((prev) => ({
                    ...prev,
                    pages: e.target.value,
                  }));
                }}
                placeholder="e.g. 436--444"
              />
              {pagesError && (
                <p className="text-destructive text-xs">{pagesError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="create-paper-number"
                className="text-sm font-medium"
              >
                Number
              </label>
              <Input
                id="create-paper-number"
                value={formData.number}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, number: e.target.value }))
                }
                placeholder="e.g. 7553"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-paper-volume"
              className="text-sm font-medium"
            >
              Volume
            </label>
            <Input
              id="create-paper-volume"
              value={formData.volume}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  volume: e.target.value,
                }))
              }
              placeholder="e.g. 521"
            />
          </div>
        </form>
        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              form="create-paper-form"
              disabled={
                createPaperMutation.isPending ||
                !formData.title.trim() ||
                !formData.authors.trim() ||
                !pdfFile ||
                isParsing
              }
              variant="darkRed"
            >
              {createPaperMutation.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
