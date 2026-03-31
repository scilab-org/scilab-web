import { useState } from 'react';
import {
  Download,
  Pencil,
  Trash2,
  Plus,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { BTN } from '@/lib/button-styles';
import { useDatasets } from '../api/get-datasets';
import { Dataset } from '../types';

const canViewChart = (filePath: string) => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  return extension === 'xlsx' || extension === 'xls' || extension === 'csv';
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
  const [pendingDeleteDatasetId, setPendingDeleteDatasetId] = useState<
    string | null
  >(null);
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
              className="btn-create flex items-center gap-2"
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      File
                    </TableHead>
                    <TableHead className="text-right font-semibold text-green-900 dark:text-green-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset, index) => {
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
                      <TableRow
                        key={dataset.id}
                        className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
                      >
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
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canViewChart(dataset.filePath) &&
                              onViewChartClick && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => onViewChartClick(dataset)}
                                  className="flex h-8 w-8 items-center justify-center p-0 bg-blue-600 hover:bg-blue-700"
                                  title="Chart"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownload}
                              className={`flex h-8 w-8 items-center justify-center p-0 ${BTN.VIEW_OUTLINE}`}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {!readOnly && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    (onUpdateClick ?? (() => { }))(dataset)
                                  }
                                  className={`flex h-8 w-8 items-center justify-center p-0 ${BTN.EDIT_OUTLINE}`}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    setPendingDeleteDatasetId(dataset.id)
                                  }
                                  className={`flex h-8 w-8 items-center justify-center p-0 ${BTN.DANGER}`}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
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
            </div>
            {/* Pagination Controls */}
            {paging && paging.totalPages > 1 && (
              <div className="mt-6 grid grid-cols-3 items-center border-t px-4 pt-4 pb-4">
                <p className="text-muted-foreground text-sm">
                  Page{' '}
                  <span className="text-foreground font-medium">
                    {paging.pageNumber}
                  </span>{' '}
                  of{' '}
                  <span className="text-foreground font-medium">
                    {paging.totalPages}
                  </span>{' '}
                  &middot; {paging.totalCount} results
                </p>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!paging.hasPreviousPage}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {Array.from({ length: paging.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (paging.totalPages <= 7) return true;
                      if (p === 1 || p === paging.totalPages) return true;
                      if (Math.abs(p - paging.pageNumber) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="text-muted-foreground px-0.5 text-sm"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={
                            item === paging.pageNumber ? 'default' : 'outline'
                          }
                          size="icon"
                          className={`size-8 text-xs ${item === paging.pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </Button>
                      ),
                    )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!paging.hasNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>

                  <div className="ml-3 flex items-center gap-1.5 border-l pl-3">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      Go to
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={paging.totalPages}
                      defaultValue={paging.pageNumber}
                      className="h-8 w-14 text-center text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = Number(
                            (e.target as HTMLInputElement).value,
                          );
                          if (val >= 1 && val <= paging.totalPages) {
                            setPage(val);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div />
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

      <AlertDialog
        open={!!pendingDeleteDatasetId}
        onOpenChange={(open) => !open && setPendingDeleteDatasetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dataset? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteDatasetId) {
                  (onDeleteClick ?? (() => { }))(pendingDeleteDatasetId);
                  setPendingDeleteDatasetId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
