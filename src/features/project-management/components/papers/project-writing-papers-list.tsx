import { useState, useEffect } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { BTN } from '@/lib/button-styles';
import { useSubProjects } from '../../api/papers/get-sub-projects';
import { useDeleteSubProject } from '../../api/papers/delete-sub-project';
import { SubProjectPaper } from '../../types';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';
import { useUser } from '@/lib/auth';
import { paths } from '@/config/paths';

const getStatusColor = (status: number | null) => {
  switch (status) {
    case 1: // Draft
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    case 2: // Processing
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    case 3: // Submitted
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 4: // Released
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 5: // Sampled
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

type ProjectWritingPapersListProps = {
  projectId: string;
  getPaperHref?: (projectId: string, paperId: string) => string;
  isManager?: boolean;
  isAuthor?: boolean;
  readOnly?: boolean;
  onCreatePaperClick?: () => void;
};

export const ProjectWritingPapersList = ({
  projectId,
  getPaperHref,
  isManager = false,
  isAuthor = false,
  readOnly = false,
  onCreatePaperClick,
}: ProjectWritingPapersListProps) => {
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [paperToDelete, setPaperToDelete] = useState<SubProjectPaper | null>(
    null,
  );

  const { data: user } = useUser();
  const navigate = useNavigate();

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

  const deleteSubProjectMutation = useDeleteSubProject({
    projectId,
    mutationConfig: {
      onSuccess: () => toast.success('Paper removed from project successfully'),
      onError: () => toast.error('Failed to remove paper. Please try again.'),
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
          {(isManager || isAuthor) && !!onCreatePaperClick && (
            <Button
              onClick={onCreatePaperClick}
              size="sm"
              className="btn-create flex items-center gap-2"
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Title
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Type
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Template
                  </TableHead>
                  <TableHead className="text-right font-semibold text-green-900 dark:text-green-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper, index) => (
                  <TableRow
                    key={paper.id}
                    className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
                  >
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          const href = getPaperHref
                            ? getPaperHref(projectId, paper.id)
                            : readOnly
                              ? paths.app.projectPaperDetail.getHref(
                                  projectId,
                                  paper.id,
                                )
                              : paths.app.assignedProjects.paperDetail.getHref(
                                  projectId,
                                  paper.id,
                                );
                          navigate(href);
                        }}
                        className="text-left text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {paper.title || '(Untitled)'}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {paper.paperType || '—'}
                    </TableCell>
                    <TableCell>
                      {paper.status != null ? (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(paper.status)}`}
                        >
                          {PAPER_STATUS_MAP[paper.status] ?? 'Unknown'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {paper.template || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(user?.preferredUsername === paper.createdBy ||
                          isManager) &&
                          !readOnly && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setPaperToDelete(paper)}
                              disabled={!paper.subProjectId}
                              className={`flex h-8 w-8 items-center justify-center p-0 ${BTN.DANGER}`}
                              title="Delete Paper"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : searchDebounce ? (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No papers found for &ldquo;{searchDebounce}&rdquo;
            </p>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">No papers yet</p>
            {(isManager || isAuthor) && !!onCreatePaperClick && (
              <p className="text-muted-foreground mt-1 text-xs">
                Use the button above to create a paper in this project
              </p>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!paperToDelete}
        onOpenChange={(o) => {
          if (!o) setPaperToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove paper from project</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{' '}
              <span className="text-foreground font-semibold">
                {paperToDelete?.title ?? '(Untitled)'}
              </span>{' '}
              from this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (paperToDelete?.subProjectId) {
                  deleteSubProjectMutation.mutate(paperToDelete.subProjectId);
                }
                setPaperToDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
