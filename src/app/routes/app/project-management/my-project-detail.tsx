import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Users,
  FileText,
  Database,
  Calendar,
  Hash,
  Info,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import {
  useProjectDetail,
  getProjectQueryOptions,
} from '@/features/project-management/api/projects/get-project';
import { useMyProjectRole } from '@/features/project-management/api/projects/get-my-role';
import { useRemoveMembers } from '@/features/project-management/api/members/remove-members';
import { useRemoveProjectPapers } from '@/features/project-management/api/papers/remove-project-papers';
import { ProjectView } from '@/features/project-management/components/projects/project-view';
import { UpdateProject } from '@/features/project-management/components/projects/update-project';
import { ProjectMembersList } from '@/features/project-management/components/members/project-members-list';
import { AddMembersModal } from '@/features/project-management/components/members/add-members-modal';
import { ProjectPapersList } from '@/features/project-management/components/papers/project-papers-list';
import { AddPapersModal } from '@/features/project-management/components/papers/add-papers-modal';
import { ProjectWritingPapersList } from '@/features/project-management/components/papers/project-writing-papers-list';
import { CreatePaperInProject } from '@/features/paper-management/components/create-paper-in-project';
import { DatasetsList } from '@/features/dataset-management/components/datasets-list';
import { CreateDataset } from '@/features/dataset-management/components/create-dataset';
import { UpdateDataset } from '@/features/dataset-management/components/update-dataset';
import { ExcelChartViewer } from '@/features/dataset-management/components/excel-chart-viewer';
import { useDeleteDataset } from '@/features/dataset-management/api/delete-dataset';
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
  { id: 'members', label: 'Members', icon: Users },
  { id: 'papers', label: 'Refereces', icon: FileText },
  { id: 'writing-papers', label: 'Papers', icon: FileText },
  { id: 'datasets', label: 'Datasets', icon: Database },
];

const STATUS_LABEL: Record<number, string> = {
  1: 'Draft',
  2: 'Active',
  3: 'Completed',
  4: 'Archived',
};

const STATUS_CLASS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  2: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  3: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  4: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

const BORDER_CLASS: Record<number, string> = {
  1: 'border-l-gray-400',
  2: 'border-l-blue-500',
  3: 'border-l-green-500',
  4: 'border-l-amber-500',
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const MyProjectDetailRoute = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [updateOpen, setUpdateOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [addPapersOpen, setAddPapersOpen] = useState(false);
  const [createPaperOpen, setCreatePaperOpen] = useState(false);
  const [createDatasetOpen, setCreateDatasetOpen] = useState(false);
  const [updateDatasetOpen, setUpdateDatasetOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<
    string | undefined
  >();
  const [removingPaperId, setRemovingPaperId] = useState<string | undefined>();
  const [chartViewerOpen, setChartViewerOpen] = useState(false);
  const [chartDataset, setChartDataset] = useState<Dataset | null>(null);

  // Detect role from API: GET /projects/{projectId}/my-role
  const roleQuery = useMyProjectRole({
    projectId: projectId!,
    queryConfig: { enabled: !!projectId },
  });
  const isManager = roleQuery.data?.result === 'project:project-manager';
  const isAuthor = roleQuery.data?.result === 'project:author';

  const projectQuery = useProjectDetail({
    projectId: projectId!,
    queryConfig: { enabled: !!projectId },
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

  const removePaperMutation = useRemoveProjectPapers({
    projectId: projectId!,
    mutationConfig: {
      onSuccess: () => {
        setRemovingPaperId(undefined);
        toast.success('Paper removed successfully');
      },
      onError: (error: any) => {
        setRemovingPaperId(undefined);
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else {
          toast.error('Failed to remove paper. Please try again.');
        }
      },
    },
  });

  const deleteDatasetMutation = useDeleteDataset({
    mutationConfig: {
      onSuccess: () => {
        // Dataset list will automatically refresh due to query invalidation
      },
    },
  });

  const handleRemoveMember = (memberId: string) => {
    setRemovingMemberId(memberId);
    removeMemberMutation.mutate({ memberIds: [memberId] });
  };

  const handleRemovePaper = (paperId: string) => {
    setRemovingPaperId(paperId);
    removePaperMutation.mutate({ paperIds: [paperId] });
  };

  const handleUpdateDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setUpdateDatasetOpen(true);
  };

  const handleDeleteDataset = (datasetId: string) => {
    deleteDatasetMutation.mutate(datasetId);
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
            onClick={() => navigate(paths.app.assignedProjects.list.getHref())}
            className="mt-4"
          >
            Back to Assigned Projects
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
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
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
            onClick={() => navigate(paths.app.assignedProjects.list.getHref())}
            className="mt-4"
          >
            Back to Assigned Projects
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const project = projectQuery.data.result.project;
  const statusLabel = STATUS_LABEL[project.status] ?? 'Unknown';
  const statusClass = STATUS_CLASS[project.status] ?? STATUS_CLASS[1];
  const borderClass = BORDER_CLASS[project.status] ?? BORDER_CLASS[1];

  return (
    <ContentLayout title="" description="">
      <div className="space-y-5">


        {/* Project banner */}
        <div
          className={`border-border bg-card rounded-xl border border-l-4 px-6 py-5 shadow-sm ${borderClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-2xl font-bold">
                  {project.name}
                </h1>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground font-mono text-sm">
                  {project.code}
                </span>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="text-foreground font-medium">
                    {project.startDate ? formatDate(project.startDate) : '—'}
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
              viewerIsProjectManager={isManager}
              onAddMembersClick={
                isManager ? () => setAddMembersOpen(true) : undefined
              }
              onRemoveMember={isManager ? handleRemoveMember : undefined}
              removingMemberId={removingMemberId}
            />
          )}

          {activeTab === 'papers' && (
            <ProjectPapersList
              projectId={projectId}
              onAddPapersClick={
                isManager ? () => setAddPapersOpen(true) : undefined
              }
              onRemovePaper={isManager ? handleRemovePaper : undefined}
              removingPaperId={removingPaperId}
              readOnly={!isManager}
            />
          )}

          {activeTab === 'writing-papers' && (
            <ProjectWritingPapersList
              projectId={projectId}
              isManager={isManager}
              isAuthor={isAuthor}
              onCreatePaperClick={
                isManager || isAuthor
                  ? () => setCreatePaperOpen(true)
                  : undefined
              }
            />
          )}

          {activeTab === 'datasets' && (
            <DatasetsList
              projectId={projectId}
              onCreateClick={
                isManager ? () => setCreateDatasetOpen(true) : undefined
              }
              onUpdateClick={isManager ? handleUpdateDataset : undefined}
              onDeleteClick={isManager ? handleDeleteDataset : undefined}
              readOnly={!isManager}
              onViewChartClick={handleViewChart}
            />
          )}
        </div>
      </div>

      {isManager && (
        <UpdateProject
          project={project}
          open={updateOpen}
          onOpenChange={setUpdateOpen}
        />
      )}

      {isManager && (
        <AddMembersModal
          projectId={projectId}
          open={addMembersOpen}
          onOpenChange={setAddMembersOpen}
        />
      )}

      {isManager && (
        <AddPapersModal
          projectId={projectId}
          open={addPapersOpen}
          onOpenChange={setAddPapersOpen}
        />
      )}

      {(isManager || isAuthor) && (
        <CreatePaperInProject
          projectId={projectId}
          open={createPaperOpen}
          onOpenChange={setCreatePaperOpen}
        />
      )}

      {isManager && (
        <CreateDataset
          projectId={projectId}
          open={createDatasetOpen}
          onOpenChange={setCreateDatasetOpen}
        />
      )}

      {isManager && (
        <UpdateDataset
          projectId={projectId}
          dataset={selectedDataset}
          open={updateDatasetOpen}
          onOpenChange={setUpdateDatasetOpen}
        />
      )}

      {chartViewerOpen && chartDataset && (
        <ExcelChartViewer
          fileUrl={chartDataset.filePath}
          fileName={chartDataset.name}
          onClose={handleCloseChartViewer}
        />
      )}
    </ContentLayout>
  );
};

export default MyProjectDetailRoute;
