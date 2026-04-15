import { useState, useEffect } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

import { CreateButton } from '@/components/ui/create-button';
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

import { useSubProjects } from '../../api/papers/get-sub-projects';
import { useDeleteSubProject } from '../../api/papers/delete-sub-project';
import { usePaperMembers } from '../../api/papers/get-paper-members';
import { SubProjectPaper } from '../../types';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';
import { useUser } from '@/lib/auth';
import { paths } from '@/config/paths';
import { BTN } from '@/lib/button-styles';

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

const PaperMembersCount = ({ subProjectId }: { subProjectId: string }) => {
  const query = usePaperMembers({
    subProjectId,
    params: { pageNumber: 1, pageSize: 1 },
  });

  if (query.isLoading) {
    return <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />;
  }

  const count = (query.data as any)?.result?.paging?.totalCount ?? 0;

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
      <Users className="h-4 w-4" />
      {count}
    </div>
  );
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
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border bg-empty-state border-b px-6 py-4">
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
            <CreateButton
              onClick={onCreatePaperClick}
              size="sm"
              className="flex items-center gap-2"
              label="Add Paper"
            />
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
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-muted-foreground w-[40%] text-xs font-medium tracking-wider uppercase">
                    Title
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[15%] text-xs font-medium tracking-wider uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[15%] text-xs font-medium tracking-wider uppercase">
                    Template
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[15%] text-xs font-medium tracking-wider uppercase">
                    Members
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[15%] text-right text-xs font-medium tracking-wider uppercase">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper) => (
                  <TableRow key={paper.id} className="hover:bg-muted/30">
                    <TableCell className="overflow-hidden font-medium">
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
                        className="block w-full truncate text-left text-blue-600 hover:underline dark:text-blue-400"
                        title={paper.title || '(Untitled)'}
                      >
                        {paper.title || '(Untitled)'}
                      </button>
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
                    <TableCell>
                      {paper.subProjectId ? (
                        <PaperMembersCount subProjectId={paper.subProjectId} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAuthor && !readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`${BTN.EDIT_OUTLINE} uppercase`}
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
                          >
                            EDIT
                          </Button>
                        )}
                        {(user?.preferredUsername === paper.createdBy ||
                          isManager) &&
                          !readOnly && (
                            <Button
                              variant="destructive"
                              className={`${BTN.DANGER} uppercase`}
                              onClick={() => setPaperToDelete(paper)}
                            >
                              DELETE
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
          <div className="bg-empty-state rounded-b-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No papers found for &ldquo;{searchDebounce}&rdquo;
            </p>
          </div>
        ) : (
          <div className="bg-empty-state rounded-b-lg py-12 text-center">
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
