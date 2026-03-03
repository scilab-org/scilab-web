import { useState } from 'react';
import { Download, Pencil, Trash2, Plus, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useDatasets } from '../api/get-datasets';
import { Dataset } from '../types';

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

type DatasetsListProps = {
  projectId: string;
  onCreateClick?: () => void;
  onUpdateClick?: (dataset: Dataset) => void;
  onDeleteClick?: (datasetId: string) => void;
  onViewChartClick?: (dataset: Dataset) => void;
  readOnly?: boolean;
};

export const DatasetsList = ({
  projectId,
  onCreateClick,
  onUpdateClick,
  onDeleteClick,
  onViewChartClick,
  readOnly = false,
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
          {!readOnly && (
            <Button
              onClick={onCreateClick}
              size="sm"
              className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Upload Dataset
            </Button>
          )}
        </div>
      </div>
      <div>
        {datasetsQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : datasets && datasets.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => {
                  const fileName =
                    dataset.filePath.split('/').pop() || 'Unknown';
                  const fileExtension =
                    fileName.split('.').pop()?.toUpperCase() || '';
                  const handleDownload = () => {
                    if (dataset.filePath.startsWith('http')) {
                      window.open(dataset.filePath, '_blank');
                    } else {
                      window.open(
                        `${window.location.origin}${dataset.filePath}`,
                        '_blank',
                      );
                    }
                  };
                  return (
                    <TableRow key={dataset.id}>
                      <TableCell className="font-medium">
                        {dataset.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                        {dataset.description || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-xs font-bold">
                            {fileExtension}
                          </span>
                          <span className="font-mono text-sm">{fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusColor(dataset.status)}`}
                        >
                          {getStatusText(dataset.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canViewChart(dataset.filePath) &&
                            onViewChartClick && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onViewChartClick(dataset)}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                                Chart
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
                          {!readOnly && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  (onUpdateClick ?? (() => {}))(dataset)
                                }
                                className="flex items-center gap-1.5"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  (onDeleteClick ?? (() => {}))(dataset.id)
                                }
                                className="flex items-center gap-1.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {paging && paging.totalPages > 1 && (
              <div className="border-border mt-4 flex items-center justify-center gap-2 border-t px-6 py-4">
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
