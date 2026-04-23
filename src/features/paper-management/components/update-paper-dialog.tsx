import { Upload } from 'lucide-react';
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
} from '@/components/ui/dialog';

import { useJournals } from '@/features/journal-management/api/get-journals';
import { useUpdatePaper } from '../api/update-paper';
import { PaperDto } from '../types';
import { TagAutocompleteInput } from './tag-autocomplete-input';
import {
  GapTypeMultiSelect,
  gapTypeTextareaClassName,
} from './gap-type-multi-select';
import { useGapTypes } from '@/features/gap-type-management/api/get-gap-types';

// ... (content copied from UpdatePaper with consistent dialog layout)

type UpdatePaperDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const UpdatePaperDialog = ({
  open,
  onOpenChange,
  paperId,
  paper,
}: UpdatePaperDialogProps) => {
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
    ranking: paper?.ranking || '',
    url: paper?.url || '',
    conferenceJournalId: '',
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
  const [pubYearError] = React.useState('');
  const [keywordList, setKeywordList] = React.useState<string[]>(
    paper?.keywords || [],
  );
  const [isAutoTagged] = React.useState(paper?.isAutoTagged || false);
  const [bibFile] = React.useState<File | undefined>();
  const [bibReferenceContent] = React.useState('');
  const gapTypesQuery = useGapTypes({
    params: { PageSize: 1000, PageNumber: 1 },
  });
  const gapTypes = React.useMemo(
    () => gapTypesQuery.data?.result?.items ?? [],
    [gapTypesQuery.data?.result?.items],
  );
  const journalsQuery = useJournals({ params: { PageSize: 1000 } });
  const journals = React.useMemo(
    () => journalsQuery.data?.result?.items ?? [],
    [journalsQuery.data?.result?.items],
  );
  const updatePaperMutation = useUpdatePaper({
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
        toast.success('Paper updated successfully');
      },
      onError: () => toast.error('Failed to update paper'),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedJournal = journals.find(
      (j) => j.id === formData.conferenceJournalId,
    );
    updatePaperMutation.mutate({
      paperId,
      data: {
        ...formData,
        publicationDate: `${pubYear.padStart(4, '0')}-${(pubMonth || '01').padStart(2, '0')}-${(pubDay || '01').padStart(2, '0')}`,
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
            journalName: selectedJournal?.name ?? '',
            pages: formData.pages,
            volume: formData.volume,
            publicationYear: pubYear,
            publicationMonth: pubMonth,
          }),
        keywords: keywordList,
        isAutoTagged,
        isIngested: paper.isIngested,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-dialog max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Paper</DialogTitle>
          <DialogDescription>
            Update information for &quot;{paper.title}&quot;
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-paper-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="update-paper-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="update-paper-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="update-paper-abstract"
              className="text-sm font-medium"
            >
              Abstract
            </label>
            <textarea
              id="update-paper-abstract"
              className={gapTypeTextareaClassName.replace(
                'min-h-24',
                'min-h-20',
              )}
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Gap Types</p>
            <GapTypeMultiSelect
              gapTypes={gapTypes}
              selectedIds={formData.gapTypeIds}
              onChange={(next) =>
                setFormData((prev) => ({ ...prev, gapTypeIds: next }))
              }
              inputId="update-paper-gap-types"
              listboxId="update-paper-gap-types-listbox"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Keywords</p>
            <TagAutocompleteInput
              tagList={keywordList}
              onAddTag={(v) => setKeywordList((prev) => [...prev, v])}
              onRemoveTag={(v) =>
                setKeywordList((prev) => prev.filter((t) => t !== v))
              }
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">BibTeX File</p>
            <div className="border-input bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
              <Upload className="size-4" />
              <span className="text-sm">Upload supported</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Publication Date</p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                id="update-paper-publication-year"
                value={pubYear}
                onChange={(e) => setPubYear(e.target.value)}
              />
              <Input
                id="update-paper-publication-month"
                value={pubMonth}
                onChange={(e) => setPubMonth(e.target.value)}
              />
              <Input
                id="update-paper-publication-day"
                value={pubDay}
                onChange={(e) => setPubDay(e.target.value)}
              />
            </div>
            {pubYearError && (
              <p className="text-destructive text-xs">{pubYearError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="update-paper-authors"
              className="text-sm font-medium"
            >
              Authors
            </label>
            <Input
              id="update-paper-authors"
              value={formData.authors}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, authors: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="update-paper-doi" className="text-sm font-medium">
              DOI
            </label>
            <Input
              id="update-paper-doi"
              value={formData.doi}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, doi: e.target.value }))
              }
            />
          </div>
        </form>
        <DialogFooter className="pt-2">
          <Button type="submit" form="update-paper-form" variant="darkRed">
            SAVE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
