import { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  Loader2,
  Search,
  Plus,
  Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useProjectPapers } from '../../api/papers/get-project-papers';
import { ProjectPaper } from '../../types';

type PaperCardProps = {
  paper: ProjectPaper;
  onRemove: (paperId: string) => void;
  isRemoving?: boolean;
  readOnly?: boolean;
};

const PaperCard = ({
  paper,
  onRemove,
  isRemoving,
  readOnly = false,
}: PaperCardProps) => {
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="border-border rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="bg-primary/10 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-foreground font-medium">
                {paper.title || '(Untitled)'}
              </h4>
              {paper.status && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(paper.status)}`}
                >
                  {paper.status}
                </span>
              )}
            </div>
            {paper.abstract && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {paper.abstract}
              </p>
            )}
            <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
              {paper.doi && (
                <span>
                  <span className="font-medium">DOI:</span> {paper.doi}
                </span>
              )}
              {paper.journalName && (
                <span>
                  <span className="font-medium">Journal:</span>{' '}
                  {paper.journalName}
                </span>
              )}
              {paper.conferenceName && (
                <span>
                  <span className="font-medium">Conference:</span>{' '}
                  {paper.conferenceName}
                </span>
              )}
              {paper.publicationDate && (
                <span>
                  <span className="font-medium">Published:</span>{' '}
                  {new Date(paper.publicationDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {paper.filePath && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={paper.filePath}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="h-3.5 w-3.5" />
                <span className="ml-1.5">Download</span>
              </a>
            </Button>
          )}
          {!readOnly && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemove(paper.id)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">Remove</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

type ProjectPapersListProps = {
  projectId: string;
  onAddPapersClick?: () => void;
  onRemovePaper?: (paperId: string) => void;
  removingPaperId?: string;
  readOnly?: boolean;
};

export const ProjectPapersList = ({
  projectId,
  onAddPapersClick,
  onRemovePaper,
  removingPaperId,
  readOnly = false,
}: ProjectPapersListProps) => {
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDebounce(searchText), 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  const papersQuery = useProjectPapers({
    projectId,
    params: { searchText: searchDebounce || undefined },
  });

  const papers: ProjectPaper[] = (papersQuery.data as any)?.result?.items ?? [];
  const totalCount: number = (papersQuery.data as any)?.result?.totalCount ?? 0;

  return (
    <div className="border-border rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border bg-muted/30 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              Project Papers
            </h2>
            {!papersQuery.isLoading && (
              <p className="text-muted-foreground mt-1 text-sm">
                {totalCount} paper{totalCount !== 1 ? 's' : ''} in this project
              </p>
            )}
          </div>
          {!readOnly && !!onAddPapersClick && (
            <Button
              onClick={onAddPapersClick}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Papers
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by title, DOI..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {papersQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : papers.length > 0 ? (
          <div className="space-y-3">
            {papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onRemove={onRemovePaper ?? (() => {})}
                isRemoving={removingPaperId === paper.id}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : searchDebounce ? (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No papers found for &ldquo;{searchDebounce}&rdquo;
            </p>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">No papers added yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Click &ldquo;Add Papers&rdquo; to link papers to this project
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
