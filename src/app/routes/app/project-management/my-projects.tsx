import { QueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, FolderOpen } from 'lucide-react';

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
import { Pagination } from '@/components/ui/pagination';
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
      description="Research projects you are a contributor to"
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

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
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
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Start</TableHead>
                    <TableHead className="font-semibold">End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project, index) => {
                    const cfg = getStatusConfig(project.status);
                    return (
                      <TableRow
                        key={project.id}
                        className={`hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <TableCell className="text-muted-foreground text-sm">
                          {project.code}
                        </TableCell>
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
                          {project.startDate
                            ? formatDate(project.startDate)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {project.endDate ? formatDate(project.endDate) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {paging && <Pagination paging={paging} />}
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
                : 'Projects you contribute to will appear here'}
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
