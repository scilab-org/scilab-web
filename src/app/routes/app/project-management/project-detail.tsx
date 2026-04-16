import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { toast } from 'sonner';
import {
  Calendar,
  Database,
  FileText,
  Hash,
  Info,
  Trash2,
  Users,
  Pencil,
  Loader2,
} from 'lucide-react';
import { useRemoveMembers } from '@/features/project-management/api/members/remove-members';
import { useRemoveProjectManagers } from '@/features/project-management/api/members/remove-project-managers';
import { AddMembersModal } from '@/features/project-management/components/members/add-members-modal';
import { UpdateProject } from '@/features/project-management/components/projects/update-project';
import { getUserGroups } from '@/lib/auth';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { paths } from '@/config/paths';

import {
  useProjectDetail,
  getProjectQueryOptions,
} from '@/features/project-management/api/projects/get-project';
import { useDeleteProject } from '@/features/project-management/api/projects/delete-project';
import { ProjectView } from '@/features/project-management/components/projects/project-view';
import { ProjectMembersList } from '@/features/project-management/components/members/project-members-list';
import { ProjectPapersList } from '@/features/project-management/components/papers/project-papers-list';
import { ProjectWritingPapersList } from '@/features/project-management/components/papers/project-writing-papers-list';
import { DatasetsList } from '@/features/dataset-management/components/datasets-list';
import { ExcelChartViewer } from '@/features/dataset-management/components/excel-chart-viewer';
import { Dataset } from '@/features/dataset-management/types';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const projectId = params.projectId as string;

    const query = getProjectQueryOptions(projectId);

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

type Tab = 'overview' | 'members' | 'papers' | 'writing-papers' | 'datasets';

type TabConfig = {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'writing-papers', label: 'Papers', icon: FileText },
  { id: 'papers', label: 'References', icon: FileText },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'datasets', label: 'Datasets', icon: Database },
];

const STATUS_LABEL: Record<number, string> = {
  1: 'Draft',
  2: 'Active',
  3: 'Completed',
  4: 'Archived',
};

const STATUS_CLASS: Record<number, string> = {
  1: 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
  2: 'border-[#630F0F]/20 bg-[#630F0F]/10 text-[#630F0F] dark:border-[#630F0F]/40 dark:bg-[#630F0F]/20 dark:text-[#630F0F]',
  3: 'border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
  4: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const ProjectDetailRoute = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [chartViewerOpen, setChartViewerOpen] = useState(false);
  const [chartDataset, setChartDataset] = useState<Dataset | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<
    string | undefined
  >();
  const [removingManagerId, setRemovingManagerId] = useState<
    string | undefined
  >();
  const [addManagersOpen, setAddManagersOpen] = useState(false);
  const [updateProjectOpen, setUpdateProjectOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const viewerIsSystemAdmin = getUserGroups().includes('system:admin');

  const projectQuery = useProjectDetail({
    projectId: projectId!,
    queryConfig: {
      enabled: !!projectId,
    },
  });

  const deleteMutation = useDeleteProject({
    mutationConfig: {
      onSuccess: () => {
        navigate(paths.app.projects.getHref());
      },
    },
  });

  const removeMemberMutation = useRemoveMembers({
    projectId: projectId!,
    mutationConfig: {
      onSuccess: () => {
        setRemovingMemberId(undefined);
        toast.success('Member removed successfully');
      },
      onError: (error: any) => {
        setRemovingMemberId(undefined);
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else {
          toast.error('Failed to remove member. Please try again.');
        }
      },
    },
  });

  const removeManagerMutation = useRemoveProjectManagers({
    projectId: projectId!,
    mutationConfig: {
      onSuccess: () => {
        setRemovingManagerId(undefined);
        toast.success('Manager removed successfully');
      },
      onError: (error: any) => {
        setRemovingManagerId(undefined);
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else {
          toast.error('Failed to remove manager. Please try again.');
        }
      },
    },
  });

  if (!viewerIsSystemAdmin) {
    return (
      <Navigate
        to={paths.app.assignedProjects.detail.getHref(projectId!)}
        replace
      />
    );
  }

  const handleRemoveManager = (memberId: string) => {
    setRemovingManagerId(memberId);
    removeManagerMutation.mutate({ memberIds: [memberId] });
  };

  const handleRemoveMember = (memberId: string) => {
    setRemovingMemberId(memberId);
    removeMemberMutation.mutate({ memberIds: [memberId] });
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const handleViewChart = (dataset: Dataset) => {
    setChartDataset(dataset);
    setChartViewerOpen(true);
  };

  const handleCloseChartViewer = () => {
    setChartViewerOpen(false);
    setChartDataset(null);
  };

  if (!projectId) {
    return (
      <ContentLayout title="Project Not Found">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Project ID is required</p>
          <Button
            onClick={() =>
              navigate(
                viewerIsSystemAdmin
                  ? paths.app.projects.getHref()
                  : paths.app.assignedProjects.list.getHref(),
              )
            }
            className="mt-4"
          >
            {viewerIsSystemAdmin
              ? 'Back to Projects'
              : 'Back to Assigned Projects'}
          </Button>
        </div>
      </ContentLayout>
    );
  }

  if (projectQuery.isLoading) {
    return (
      <ContentLayout title="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </ContentLayout>
    );
  }

  if (!projectQuery.data?.result?.project) {
    return (
      <ContentLayout title="Project Not Found">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Button
            onClick={() =>
              navigate(
                viewerIsSystemAdmin
                  ? paths.app.projects.getHref()
                  : paths.app.assignedProjects.list.getHref(),
              )
            }
            className="mt-4"
          >
            {viewerIsSystemAdmin
              ? 'Back to Projects'
              : 'Back to Assigned Projects'}
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const project = projectQuery.data.result.project;
  const statusLabel = STATUS_LABEL[project.status] ?? 'Unknown';
  const statusClass = STATUS_CLASS[project.status] ?? STATUS_CLASS[1];

  return (
    <>
      <Head title="Project Details" />
      <div className="min-h-[101vh]">
        <ContentLayout title="" description="">
          <div className="space-y-5">
            {/* Project banner */}
            <div
              className={`border-border bg-card rounded-md border px-6 py-5 shadow-sm`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: name, code, description */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-foreground text-2xl font-bold">
                      {project.name}
                    </h1>
                    <span
                      className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="text-muted-foreground h-3.5 w-3.5" />
                    <span className="text-muted-foreground text-sm">
                      {project.code}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Right: actions + dates */}
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    {viewerIsSystemAdmin && (
                      <Button
                        variant="outlineAction"
                        size="action"
                        onClick={() => setUpdateProjectOpen(true)}
                        title="Edit"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        EDIT
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="action"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 h-3 w-3" />
                      )}
                      DELETE
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Start:</span>
                      <span className="text-foreground font-medium">
                        {project.startDate
                          ? formatDate(project.startDate)
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">End:</span>
                      <span className="text-foreground font-medium">
                        {project.endDate ? formatDate(project.endDate) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="border-border border-b">
              <nav className="-mb-px flex gap-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'text-muted-foreground hover:border-border hover:text-foreground border-transparent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'overview' && (
                <ProjectView project={project} readOnly />
              )}

              {activeTab === 'members' && (
                <ProjectMembersList
                  projectId={projectId}
                  onRemoveMember={handleRemoveMember}
                  removingMemberId={removingMemberId}
                  onRemoveManager={handleRemoveManager}
                  removingManagerId={removingManagerId}
                  onAddManagersClick={
                    viewerIsSystemAdmin
                      ? () => setAddManagersOpen(true)
                      : undefined
                  }
                />
              )}

              {activeTab === 'papers' && (
                <ProjectPapersList
                  projectId={projectId}
                  readOnly
                  getPaperHref={(_projectId, paperId) =>
                    paths.app.paperManagement.paper.getHref(paperId)
                  }
                />
              )}

              {activeTab === 'writing-papers' && (
                <ProjectWritingPapersList
                  projectId={projectId!}
                  isManager
                  readOnly
                  getPaperHref={paths.app.projectPaperDetail.getHref}
                />
              )}

              {activeTab === 'datasets' && (
                <DatasetsList
                  projectId={projectId}
                  readOnly
                  onViewChartClick={handleViewChart}
                />
              )}
            </div>
          </div>

          {viewerIsSystemAdmin && (
            <AddMembersModal
              projectId={projectId!}
              open={addManagersOpen}
              onOpenChange={setAddManagersOpen}
            />
          )}

          {viewerIsSystemAdmin && (
            <UpdateProject
              project={projectQuery.data?.result?.project ?? null}
              open={updateProjectOpen}
              onOpenChange={setUpdateProjectOpen}
            />
          )}

          {chartViewerOpen && chartDataset && (
            <ExcelChartViewer
              fileUrl={chartDataset.filePath}
              fileName={chartDataset.name}
              onClose={handleCloseChartViewer}
            />
          )}

          <AlertDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this project? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate(projectId!)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ContentLayout>
      </div>
    </>
  );
};

export default ProjectDetailRoute;
