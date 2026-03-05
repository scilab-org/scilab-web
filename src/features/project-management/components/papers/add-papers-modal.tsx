import { useState, useEffect } from 'react';
import { Loader2, Search, FileText, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

import { BTN } from '@/lib/button-styles';
import { useAvailablePapers } from '../../api/papers/get-available-papers';
import { useAddProjectPapers } from '../../api/papers/add-project-papers';
import { ProjectPaper } from '../../types';

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
          {paper.status && (
            <span className="font-medium capitalize">{paper.status}</span>
          )}
        </div>
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
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDebounce(searchText), 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const papersQuery = useAvailablePapers({
    projectId,
    searchText: searchDebounce || undefined,
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
    setSearchText('');
  };

  const papers: ProjectPaper[] = (papersQuery.data as any)?.result?.items ?? [];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          handleReset();
        }
        onOpenChange(o);
      }}
    >
      <SheetContent className="flex flex-col sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <SheetTitle>Add Papers</SheetTitle>
          </div>
          <SheetDescription>
            Search and select papers to add to this project.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search papers by title, DOI..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-10"
            />
          </div>

          {/* Selection summary */}
          {selectedPapers.size > 0 && (
            <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
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
          <div className="max-h-120 space-y-2 overflow-y-auto pr-1">
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
            ) : searchDebounce ? (
              <div className="bg-muted/30 rounded-lg py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No papers found for &ldquo;{searchDebounce}&rdquo;
                </p>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Start typing to search for available papers
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Only papers not already in this project will appear
                </p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button
              variant="outline"
              disabled={addPapersMutation.isPending}
              className={BTN.CANCEL}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={selectedPapers.size === 0 || addPapersMutation.isPending}
            className={`gap-2 ${BTN.CREATE}`}
          >
            {addPapersMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Papers ({selectedPapers.size})
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
