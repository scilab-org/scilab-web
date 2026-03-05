import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Search, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { paths } from '@/config/paths';
import { PaperMembersSheet } from './paper-members-sheet';

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
  isManager?: boolean;
  isAuthor?: boolean;
  onCreatePaperClick?: () => void;
};

export const ProjectWritingPapersList = ({
  projectId,
  isManager = false,
  isAuthor = false,
  onCreatePaperClick,
}: ProjectWritingPapersListProps) => {
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [membersSheetPaper, setMembersSheetPaper] =
    useState<SubProjectPaper | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<SubProjectPaper | null>(
    null,
  );

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
          {isManager && !!onCreatePaperClick && (
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
                    Journal / Conference
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Published
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMembersSheetPaper(paper)}
                          disabled={!paper.subProjectId}
                          className={`flex items-center gap-1.5 ${BTN.VIEW_OUTLINE}`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          Members
                        </Button>
                        {isManager && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaperToDelete(paper)}
                            disabled={!paper.subProjectId}
                            className={`flex items-center gap-1.5 ${BTN.DANGER_OUTLINE}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
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
            {isManager && !!onCreatePaperClick && (
              <p className="text-muted-foreground mt-1 text-xs">
                Use the button above to create a paper in this project
              </p>
            )}
          </div>
        )}
      </div>

      {membersSheetPaper && membersSheetPaper.subProjectId && (
        <PaperMembersSheet
          subProjectId={membersSheetPaper.subProjectId}
          isManager={isManager}
          isAuthor={isAuthor}
          paperTitle={membersSheetPaper.title ?? '(Untitled)'}
          open={!!membersSheetPaper}
          onOpenChange={(o) => {
            if (!o) setMembersSheetPaper(null);
          }}
        />
      )}

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
