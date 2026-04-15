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
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';
import { useAvailablePapers } from '../../api/papers/get-available-papers';
import { useAddProjectPapers } from '../../api/papers/add-project-papers';
import { ProjectPaper } from '../../types';

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
  'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
  'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
  'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
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
        {paper.abstract && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {paper.abstract}
          </p>
        )}
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
          {paper.doi && <span>DOI: {paper.doi}</span>}
          {paper.journalName && <span>{paper.journalName}</span>}
          {paper.status !== null && paper.status !== undefined && (
            <span className="font-medium capitalize">
              {PAPER_STATUS_MAP[paper.status] ?? paper.status}
            </span>
          )}
        </div>
        {paper.tagNames && paper.tagNames.length > 0 && (
          <div className="mt-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
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
      searchText: titleDebounce || undefined,
      Tag: tagList.length > 0 ? tagList : undefined,
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
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
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
