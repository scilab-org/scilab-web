import { QueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
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
import { paths } from '@/config/paths';
import {
  getMyProjectsQueryOptions,
  useMyProjects,
} from '@/features/project-management/api/projects/get-my-projects';
import { Project } from '@/features/project-management/types';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const query = getMyProjectsQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Name: name,
      Status: status,
    });

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

type StatusConfig = {
  label: string;
  badgeClass: string;
  borderClass: string;
  iconBg: string;
};

const STATUS_MAP: Record<number, StatusConfig> = {
  1: {
    label: 'Draft',
    badgeClass:
      'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
    borderClass: 'border-l-gray-400',
    iconBg: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
  2: {
    label: 'Active',
    badgeClass:
      'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    borderClass: 'border-l-blue-500',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  },
  3: {
    label: 'Completed',
    badgeClass:
      'border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300',
    borderClass: 'border-l-green-500',
    iconBg:
      'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
  },
  4: {
    label: 'Archived',
    badgeClass:
      'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    borderClass: 'border-l-amber-500',
    iconBg:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  },
};

const getStatusConfig = (status: number): StatusConfig =>
  STATUS_MAP[status] ?? STATUS_MAP[1];

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: '1' },
  { label: 'Active', value: '2' },
  { label: 'Completed', value: '3' },
  { label: 'Archived', value: '4' },
];

const MyProjectsRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') || 1);
  const name = searchParams.get('name') || '';
  const status = searchParams.get('status') || '';

  const [searchText, setSearchText] = useState(name);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchText) {
          next.set('name', searchText);
        } else {
          next.delete('name');
        }
        next.set('page', '1');
        return next;
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchText, setSearchParams]);

  const setStatus = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('status', val);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const projectsQuery = useMyProjects({
    params: {
      PageNumber: page,
      PageSize: 10,
      Name: name || undefined,
      Status: status || undefined,
    },
  });

  const projects: Project[] = (projectsQuery.data as any)?.result?.items ?? [];
  const paging = (projectsQuery.data as any)?.result?.paging;
  const hasFilters = !!(name || status);

  return (
    <ContentLayout
      title="Assigned Projects"
      description="Research projects you are a member of"
    >
      {/* Toolbar */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by project name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            className="pl-10"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
                status === f.value
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {!projectsQuery.isLoading && paging && (
        <p className="text-muted-foreground mb-4 text-sm">
          Showing{' '}
          <span className="text-foreground font-semibold">
            {projects.length}
          </span>{' '}
          of{' '}
          <span className="text-foreground font-semibold">
            {paging.totalCount}
          </span>{' '}
          project
          {paging.totalCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border shadow-sm">
        {projectsQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Code
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      Start
                    </TableHead>
                    <TableHead className="font-semibold text-green-900 dark:text-green-200">
                      End
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project, index) => {
                    const cfg = getStatusConfig(project.status);
                    return (
                      <TableRow
                        key={project.id}
                        className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
                      >
                        <TableCell className="font-medium">
                          <Link
                            to={paths.app.assignedProjects.detail.getHref(
                              project.id,
                            )}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {project.code}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                          {project.description || '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}
                          >
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(project.startDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(project.endDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {paging && (
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
                    onClick={() =>
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('page', String(page - 1));
                        return next;
                      })
                    }
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
                          onClick={() =>
                            setSearchParams((prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(item));
                              return next;
                            })
                          }
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
                    onClick={() =>
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('page', String(page + 1));
                        return next;
                      })
                    }
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
                            setSearchParams((prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(val));
                              return next;
                            });
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
          <div className="rounded-xl py-20 text-center">
            <FolderOpen className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
            <p className="text-foreground font-medium">
              {hasFilters
                ? 'No projects match your filters'
                : 'No assigned projects yet'}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {hasFilters
                ? 'Try adjusting your search or filter'
                : 'Projects you are added to will appear here'}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchText('');
                  setSearchParams({});
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default MyProjectsRoute;
