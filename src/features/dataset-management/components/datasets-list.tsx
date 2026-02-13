import { useState } from 'react';
import {
  Download,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  BarChart3,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useDatasets } from '../api/get-datasets';
import { Dataset } from '../types';

type DatasetCardProps = {
  dataset: Dataset;
  onUpdate: (dataset: Dataset) => void;
  onDelete: (datasetId: string) => void;
  onViewChart?: (dataset: Dataset) => void;
};

const DatasetCard = ({
  dataset,
  onUpdate,
  onDelete,
  onViewChart,
}: DatasetCardProps) => {
  // Check if file supports chart viewing (Excel and CSV)
  const canViewChart = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension === 'xlsx' || extension === 'xls' || extension === 'csv';
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 0:
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 0:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const handleDownload = () => {
    if (dataset.filePath.startsWith('http')) {
      window.open(dataset.filePath, '_blank');
    } else {
      window.open(`${window.location.origin}${dataset.filePath}`, '_blank');
    }
  };

  const fileName = dataset.filePath.split('/').pop() || 'Unknown';
  const fileExtension = fileName.split('.').pop()?.toUpperCase() || '';

  return (
    <div className="bg-card border-border group overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md">
      <div className="from-muted/40 to-muted/20 bg-linear-to-r px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-foreground text-base font-semibold tracking-tight">
                {dataset.name}
              </h4>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusColor(dataset.status)}`}
              >
                {getStatusText(dataset.status)}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {dataset.description}
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold">
              {fileExtension}
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                File Name
              </p>
              <p className="text-foreground mt-0.5 font-mono text-sm">
                {fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canViewChart(dataset.filePath) && onViewChart && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onViewChart(dataset)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Chart
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate(dataset)}
              className="flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(dataset.id)}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

type DatasetsListProps = {
  projectId: string;
  onCreateClick: () => void;
  onUpdateClick: (dataset: Dataset) => void;
  onDeleteClick: (datasetId: string) => void;
  onViewChartClick?: (dataset: Dataset) => void;
};

export const DatasetsList = ({
  projectId,
  onCreateClick,
  onUpdateClick,
  onDeleteClick,
  onViewChartClick,
}: DatasetsListProps) => {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const datasetsQuery = useDatasets({
    params: { projectId: projectId, PageNumber: page, PageSize: pageSize },
  });

  if (datasetsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const datasets = datasetsQuery.data?.result?.items;
  const paging = datasetsQuery.data?.result?.paging;

  return (
    <div className="border-border rounded-xl border shadow-sm">
      <div className="border-border bg-muted/30 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              Research Datasets
            </h2>
            {paging && (
              <p className="text-muted-foreground mt-1 text-sm">
                {paging.totalCount} dataset
                {paging.totalCount !== 1 ? 's' : ''} uploaded
              </p>
            )}
          </div>
          <Button
            onClick={onCreateClick}
            size="sm"
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Upload Dataset
          </Button>
        </div>
      </div>
      <div className="p-6">
        {datasetsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : datasets && datasets.length > 0 ? (
          <>
            <div className="space-y-3">
              {datasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onUpdate={onUpdateClick}
                  onDelete={onDeleteClick}
                  onViewChart={onViewChartClick}
                />
              ))}
            </div>
            {/* Pagination Controls */}
            {paging && paging.totalPages > 1 && (
              <div className="border-border mt-6 flex items-center justify-center gap-2 border-t pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={!paging.hasPreviousPage}
                >
                  Previous
                </Button>
                <div className="bg-muted text-muted-foreground flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium">
                  {paging.pageNumber} / {paging.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!paging.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-muted/30 rounded-lg py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No datasets uploaded yet
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Upload your first dataset to begin analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
