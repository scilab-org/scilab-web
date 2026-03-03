import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Trash2, Loader2, Search, Plus, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useProjectPapers } from '../../api/papers/get-project-papers';
import { ProjectPaper } from '../../types';
import { paths } from '@/config/paths';

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

type ProjectPapersListProps = {
  projectId: string;
  onAddPapersClick?: () => void;
  onCreatePaperClick?: () => void;
  onRemovePaper?: (paperId: string) => void;
  removingPaperId?: string;
  readOnly?: boolean;
};

export const ProjectPapersList = ({
  projectId,
  onAddPapersClick,
  onCreatePaperClick,
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
          <div className="flex items-center gap-2">
            {!!onCreatePaperClick && (
              <Button
                onClick={onCreatePaperClick}
                size="sm"
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Create Paper
              </Button>
            )}
            {!readOnly && !!onAddPapersClick && (
              <Button
                onClick={onAddPapersClick}
                size="sm"
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Paper Sample
              </Button>
            )}
          </div>
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
      <div>
        {papersQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : papers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>DOI</TableHead>
                <TableHead>Journal / Conference</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={paths.app.paperManagement.paper.getHref(paper.id)}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {paper.title || '(Untitled)'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {paper.status ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(paper.status)}`}
                      >
                        {paper.status}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {paper.doi || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                    {paper.journalName || paper.conferenceName || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {paper.publicationDate
                      ? new Date(paper.publicationDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
                          onClick={() =>
                            (onRemovePaper ?? (() => {}))(paper.id)
                          }
                          disabled={removingPaperId === paper.id}
                        >
                          {removingPaperId === paper.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1.5">Remove</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              Use the buttons above to add or create papers in this project
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
