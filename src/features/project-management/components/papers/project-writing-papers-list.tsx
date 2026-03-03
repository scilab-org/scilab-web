import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';

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

import { useSubProjects } from '../../api/papers/get-sub-projects';
import { SubProjectPaper } from '../../types';
import { paths } from '@/config/paths';

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'released':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 'submited':
    case 'submitted':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'sampled':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

type ProjectWritingPapersListProps = {
  projectId: string;
  onCreatePaperClick?: () => void;
};

export const ProjectWritingPapersList = ({
  projectId,
  onCreatePaperClick,
}: ProjectWritingPapersListProps) => {
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(searchText), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const papersQuery = useSubProjects({
    projectId,
    params: {
      PageNumber: 1,
      PageSize: 100,
      title: searchDebounce || undefined,
    },
  });

  const papers: SubProjectPaper[] =
    (papersQuery.data as any)?.result?.items ?? [];
  const totalCount: number =
    (papersQuery.data as any)?.result?.paging?.totalCount ?? papers.length;

  return (
    <div className="border-border rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border bg-muted/30 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Papers</h2>
            {!papersQuery.isLoading && (
              <p className="text-muted-foreground mt-1 text-sm">
                {totalCount} paper{totalCount !== 1 ? 's' : ''} in this project
              </p>
            )}
          </div>
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
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by title..."
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Journal / Conference</TableHead>
                <TableHead>Published</TableHead>
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
                  <TableCell className="text-muted-foreground text-sm">
                    {paper.paperType || '—'}
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
                  <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                    {paper.journalName || paper.conferenceName || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {paper.publicationDate
                      ? new Date(paper.publicationDate).toLocaleDateString()
                      : '—'}
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
            <p className="text-muted-foreground text-sm">No papers yet</p>
            {!!onCreatePaperClick && (
              <p className="text-muted-foreground mt-1 text-xs">
                Use the button above to create a paper in this project
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
