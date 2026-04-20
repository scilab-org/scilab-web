import { useState, useEffect, type FormEvent } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

import { CreateButton } from '@/components/ui/create-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useSubProjects } from '../../api/papers/get-sub-projects';
import { useMyAssignedPapers } from '@/features/task-management/api/get-my-assigned-papers';
import { useDeleteSubProject } from '../../api/papers/delete-sub-project';
import { usePaperMembers } from '../../api/papers/get-paper-members';
import { SubProjectPaper } from '../../types';
import {
  PAPER_INITIALIZE_STATUS_OPTIONS,
  SUBMISSION_STATUS_LABELS,
} from '@/features/paper-management/constants';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { useUpdateWritingPaper } from '@/features/paper-management/api/update-writing-paper';
import { useUser } from '@/lib/auth';
import { paths } from '@/config/paths';
import { BTN } from '@/lib/button-styles';

type BadgeVariant = 'draft' | 'active' | 'outline' | 'success' | 'secondary';

const getSubmissionStatusVariant = (status: number | null): BadgeVariant => {
  switch (status) {
    case 1:
      return 'draft'; // Draft
    case 2:
      return 'active'; // Submitted
    case 3:
      return 'outline'; // Revision Required
    case 4:
      return 'active'; // Resubmitted
    case 5:
      return 'success'; // Accepted
    case 6:
      return 'success'; // Published
    case 7:
      return 'secondary'; // Rejected
    case 8:
      return 'outline'; // On Hold
    default:
      return 'draft';
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
  const [editingPaper, setEditingPaper] = useState<SubProjectPaper | null>(
    null,
  );
  const [editPaperForm, setEditPaperForm] = useState({
    context: '',
    abstract: '',
    researchGap: '',
    researchAim: '',
    gapType: '',
    mainContribution: '',
    status: 1,
  });

  const { data: user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(searchText), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const subProjectsQuery = useSubProjects({
    projectId,
    params: {
      PageNumber: 1,
      PageSize: 100,
      title: searchDebounce || undefined,
    },
    queryConfig: { enabled: isManager, refetchOnMount: 'always' },
  });

  const assignedPapersQuery = useMyAssignedPapers({
    params: {
      ProjectId: projectId,
      PageNumber: 1,
      PageSize: 100,
      title: searchDebounce || undefined,
    },
    queryConfig: { enabled: !isManager, refetchOnMount: 'always' },
  });

  const papersQuery = isManager ? subProjectsQuery : assignedPapersQuery;
  const editingPaperDetailQuery = useWritingPaperDetail({
    paperId: editingPaper?.id ?? '',
    queryConfig: { enabled: !!editingPaper?.id } as any,
  });

  const deleteSubProjectMutation = useDeleteSubProject({
    projectId,
    mutationConfig: {
      onSuccess: () => toast.success('Paper removed from project successfully'),
      onError: () => toast.error('Failed to remove paper. Please try again.'),
    },
  });

  const updateWritingPaperMutation = useUpdateWritingPaper({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Paper updated successfully');
        setEditingPaper(null);
        subProjectsQuery.refetch();
        assignedPapersQuery.refetch();
      },
      onError: () => toast.error('Failed to update paper'),
    },
  });

  useEffect(() => {
    const detailPaper = (editingPaperDetailQuery.data as any)?.result?.paper;
    if (!editingPaper || !detailPaper) return;

    setEditPaperForm({
      context: detailPaper.context ?? '',
      abstract: detailPaper.abstract ?? '',
      researchGap: detailPaper.researchGap ?? '',
      researchAim: detailPaper.researchAim ?? '',
      gapType: detailPaper.gapType ?? '',
      mainContribution: detailPaper.mainContribution ?? '',
      status: detailPaper.status ?? 1,
    });
  }, [editingPaper, editingPaperDetailQuery.data]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditOpen = (paper: SubProjectPaper) => {
    setEditPaperForm({
      context: paper.context ?? '',
      abstract: paper.abstract ?? '',
      researchGap: paper.researchGap ?? '',
      researchAim: (paper as any).researchAim ?? '',
      gapType: paper.gapType ?? '',
      mainContribution: paper.mainContribution ?? '',
      status: paper.status ?? 1,
    });
    setEditingPaper(paper);
  };

  const handleEditPaperSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPaper) return;

    updateWritingPaperMutation.mutate({
      paperId: editingPaper.id,
      data: {
        context: editPaperForm.context,
        abstract: editPaperForm.abstract,
        researchGap: editPaperForm.researchGap,
        researchAim: editPaperForm.researchAim,
        gapType: editPaperForm.gapType,
        mainContribution: editPaperForm.mainContribution,
        status: editPaperForm.status,
      },
    });
  };

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
              className="flex items-center gap-2 tracking-wide uppercase"
              label="Create Paper"
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
          <div>
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead
                    className={`text-muted-foreground ${isManager ? 'w-[38%]' : 'w-[47%]'} text-xs font-medium tracking-wider uppercase`}
                  >
                    Title
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[13%] text-xs font-medium tracking-wider uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[10%] text-xs font-medium tracking-wider uppercase">
                    Template
                  </TableHead>
                  {isManager && (
                    <TableHead className="text-muted-foreground w-[9%] text-xs font-medium tracking-wider uppercase">
                      Members
                    </TableHead>
                  )}
                  <TableHead className="text-muted-foreground w-[30%] pr-6 text-center text-xs font-medium tracking-wider uppercase">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper) => {
                  const resolvedSubProjectId: string | null =
                    (paper as any).subProjectId ?? null;
                  return (
                    <TableRow key={paper.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-0 overflow-hidden font-medium">
                        <span
                          className="block truncate"
                          title={paper.title || '(Untitled)'}
                        >
                          {paper.title || '(Untitled)'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSubmissionStatusVariant(
                            paper.submissionStatus ?? 1,
                          )}
                        >
                          {SUBMISSION_STATUS_LABELS[
                            paper.submissionStatus ?? 1
                          ] ?? 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {paper.template || '—'}
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          {resolvedSubProjectId ? (
                            <PaperMembersCount
                              subProjectId={resolvedSubProjectId}
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outlineAction"
                            size="action"
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
                            VIEW
                          </Button>
                          {(user?.preferredUsername === paper.createdBy ||
                            isManager) &&
                            !readOnly && (
                              <Button
                                variant="destructive"
                                size="action"
                                className="uppercase"
                                onClick={() => setPaperToDelete(paper)}
                              >
                                DELETE
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
            <AlertDialogCancel variant="outlineAction" size="action">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-7 px-3 text-[11px] tracking-wide"
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

      <Dialog
        open={!!editingPaper}
        onOpenChange={(o) => !o && setEditingPaper(null)}
      >
        <DialogContent className="scrollbar-dialog flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Paper</DialogTitle>
            <DialogDescription>
              Update the paper details below.
            </DialogDescription>
          </DialogHeader>

          <form
            id="project-writing-edit-paper-form"
            onSubmit={handleEditPaperSubmit}
            className="scrollbar-dialog min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            <div className="space-y-1.5">
              <label htmlFor="pwl-context" className="text-sm font-medium">
                Context <span className="text-destructive">*</span>
              </label>
              <textarea
                id="pwl-context"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-24 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.context}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    context: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwl-abstract" className="text-sm font-medium">
                Abstract <span className="text-destructive">*</span>
              </label>
              <textarea
                id="pwl-abstract"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.abstract}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    abstract: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwl-research-gap" className="text-sm font-medium">
                Research Gap <span className="text-destructive">*</span>
              </label>
              <textarea
                id="pwl-research-gap"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.researchGap}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    researchGap: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwl-gap-type" className="text-sm font-medium">
                Gap Type <span className="text-destructive">*</span>
              </label>
              <Input
                id="pwl-gap-type"
                value={editPaperForm.gapType}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    gapType: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwl-research-aim" className="text-sm font-medium">
                Research Aim <span className="text-destructive">*</span>
              </label>
              <textarea
                id="pwl-research-aim"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.researchAim}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    researchAim: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pwl-main-contribution"
                className="text-sm font-medium"
              >
                Main Contribution <span className="text-destructive">*</span>
              </label>
              <textarea
                id="pwl-main-contribution"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.mainContribution}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    mainContribution: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pwl-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="pwl-status"
                className="border-surface-container-highest bg-surface text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={editPaperForm.status}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    status: Number(e.target.value),
                  }))
                }
              >
                {PAPER_INITIALIZE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              className={BTN.CANCEL}
              onClick={() => setEditingPaper(null)}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              form="project-writing-edit-paper-form"
              className={BTN.CREATE}
              disabled={updateWritingPaperMutation.isPending}
            >
              {updateWritingPaperMutation.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
