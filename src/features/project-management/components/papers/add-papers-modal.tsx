import { useState, useEffect } from 'react';
import { Loader2, Search, FileText, Check, Plus, Tags } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { TagAutocompleteInput } from '@/features/paper-management/components/tag-autocomplete-input';
import { useAvailablePapers } from '../../api/papers/get-available-papers';
import { useAddProjectPapers } from '../../api/papers/add-project-papers';
import { ProjectPaper } from '../../types';

const TAG_COLORS = [
  'border-border bg-muted text-muted-foreground',
  'border-primary/20 bg-primary/10 text-primary',
  'border-secondary/25 bg-secondary/15 text-secondary',
  'border-tertiary/20 bg-tertiary/10 text-tertiary',
  'border-outline bg-muted/70 text-on-surface-variant',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

type PaperCardProps = {
  paper: ProjectPaper;
  isSelected: boolean;
  onToggleSelect: (paperId: string) => void;
};

const PaperCard = ({ paper, isSelected, onToggleSelect }: PaperCardProps) => (
  <div
    className={`border-border cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
      isSelected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
        : 'hover:border-blue-300'
    }`}
    onClick={() => onToggleSelect(paper.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggleSelect(paper.id);
      }
    }}
    role="button"
    tabIndex={0}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isSelected
            ? 'bg-blue-500 text-white'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isSelected ? (
          <Check className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">
          {paper.title || '(Untitled)'}
        </p>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
          {paper.doi && <span>DOI: {paper.doi}</span>}
          {paper.journalName && <span>Journal: {paper.journalName}</span>}
          {!paper.journalName && paper.conferenceName && (
            <span>Conference: {paper.conferenceName}</span>
          )}
        </div>
        {paper.tagNames && paper.tagNames.length > 0 && (
          <div className="mt-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tags className="size-3" />
                  {paper.tagNames.length} tags
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56">
                <p className="mb-2 text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {paper.tagNames.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-xs ${getTagColor(tag)}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  </div>
);

type AddPapersModalProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddPapersModal = ({
  projectId,
  open,
  onOpenChange,
}: AddPapersModalProps) => {
  const [titleFilter, setTitleFilter] = useState('');
  const [titleDebounce, setTitleDebounce] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setTitleDebounce(titleFilter), 300);
    return () => clearTimeout(t);
  }, [titleFilter]);

  const papersQuery = useAvailablePapers({
    projectId,
    params: {
      Title: titleDebounce || undefined,
      Author: undefined,
      Publisher: undefined,
      Abstract: undefined,
      Doi: undefined,
      Status: undefined,
      FromPublicationDate: undefined,
      ToPublicationDate: undefined,
      PaperType: undefined,
      JournalName: undefined,
      ConferenceName: undefined,
      Tag: tagList.length > 0 ? tagList : undefined,
      ExistingPaperIds: undefined,
      PageNumber: 1,
      PageSize: 1000,
    },
    queryConfig: { enabled: open },
  });

  const addPapersMutation = useAddProjectPapers({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Papers added successfully');
        handleReset();
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to add papers. Please try again.');
      },
    },
  });

  const handleToggle = (paperId: string) => {
    setSelectedPapers((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) next.delete(paperId);
      else next.add(paperId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedPapers.size === 0) return;
    addPapersMutation.mutate({ paperIds: Array.from(selectedPapers) });
  };

  const handleReset = () => {
    setSelectedPapers(new Set());
    setTitleFilter('');
    setTagList([]);
  };

  const papers: ProjectPaper[] = (papersQuery.data as any)?.result?.items ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleReset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <DialogTitle>Add Papers</DialogTitle>
            </div>
            <DialogDescription>
              Search and select papers to add to this project.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="scrollbar-dialog flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {/* Title search */}
          <div className="relative shrink-0">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by title..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-10"
            />
          </div>

          {/* Tag filter */}
          <div className="shrink-0">
            <TagAutocompleteInput
              tagList={tagList}
              onAddTag={(tag) =>
                setTagList((prev) =>
                  prev.includes(tag) ? prev : [...prev, tag],
                )
              }
              onRemoveTag={(tag) =>
                setTagList((prev) => prev.filter((t) => t !== tag))
              }
              placeholder="Type a tag and press Enter..."
            />
          </div>

          {/* Selection summary */}
          {selectedPapers.size > 0 && (
            <div className="flex shrink-0 items-center justify-between rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedPapers.size} paper
                {selectedPapers.size !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={() => setSelectedPapers(new Set())}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear
              </button>
            </div>
          )}

          {/* Papers list */}
          <div className="flex-1 space-y-2">
            {papersQuery.isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : papers.length > 0 ? (
              papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  isSelected={selectedPapers.has(paper.id)}
                  onToggleSelect={handleToggle}
                />
              ))
            ) : (
              <div className="bg-muted/30 rounded-lg py-8 text-center">
                <p className="text-muted-foreground text-sm">No papers found</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Only papers not already in this project will appear
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="ghost"
                disabled={addPapersMutation.isPending}
                className="uppercase"
              >
                CANCEL
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={
                selectedPapers.size === 0 || addPapersMutation.isPending
              }
              variant="darkRed"
              className="uppercase"
            >
              {addPapersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ADDING...
                </>
              ) : (
                `ADD (${selectedPapers.size})`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
