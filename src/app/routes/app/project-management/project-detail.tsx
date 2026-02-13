import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import {
  useProjectDetail,
  getProjectQueryOptions,
} from '@/features/project-management/api/get-project';
import { useDeleteProject } from '@/features/project-management/api/delete-project';
import { useDeleteDataset } from '@/features/dataset-management/api/delete-dataset';
import { ProjectView } from '@/features/project-management/components/project-view';
import { DatasetsList } from '@/features/dataset-management/components/datasets-list';
import { UpdateProject } from '@/features/project-management/components/update-project';
import { CreateDataset } from '@/features/dataset-management/components/create-dataset';
import { UpdateDataset } from '@/features/dataset-management/components/update-dataset';
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

const ProjectDetailRoute = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [updateOpen, setUpdateOpen] = useState(false);
  const [createDatasetOpen, setCreateDatasetOpen] = useState(false);
  const [updateDatasetOpen, setUpdateDatasetOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [chartViewerOpen, setChartViewerOpen] = useState(false);
  const [chartDataset, setChartDataset] = useState<Dataset | null>(null);

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

  const deleteDatasetMutation = useDeleteDataset({
    mutationConfig: {
      onSuccess: () => {
        // Dataset list will automatically refresh due to query invalidation
      },
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this project? This action cannot be undone.',
      )
    ) {
      deleteMutation.mutate(projectId!);
    }
  };

  const handleUpdate = () => {
    setUpdateOpen(true);
  };

  const handleUpdateDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setUpdateDatasetOpen(true);
  };

  const handleDeleteDataset = (datasetId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this dataset? This action cannot be undone.',
      )
    ) {
      deleteDatasetMutation.mutate(datasetId);
    }
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
            onClick={() => navigate(paths.app.projects.getHref())}
            className="mt-4"
          >
            Back to Projects
          </Button>
        </div>
      </ContentLayout>
    );
  }

  if (projectQuery.isLoading) {
    return (
      <ContentLayout title="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
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
            onClick={() => navigate(paths.app.projects.getHref())}
            className="mt-4"
          >
            Back to Projects
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const project = projectQuery.data.result.project;

  return (
    <ContentLayout
      title="Research Project Details"
      description={`Comprehensive view of ${project.code}`}
    >
      <div className="space-y-6">
        <ProjectView
          project={project}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />

        <DatasetsList
          projectId={projectId}
          onCreateClick={() => setCreateDatasetOpen(true)}
          onUpdateClick={handleUpdateDataset}
          onDeleteClick={handleDeleteDataset}
          onViewChartClick={handleViewChart}
        />
      </div>

      <UpdateProject
        project={project}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />

      <CreateDataset
        projectId={projectId}
        open={createDatasetOpen}
        onOpenChange={setCreateDatasetOpen}
      />

      <UpdateDataset
        projectId={projectId}
        dataset={selectedDataset}
        open={updateDatasetOpen}
        onOpenChange={setUpdateDatasetOpen}
      />

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

export default ProjectDetailRoute;
