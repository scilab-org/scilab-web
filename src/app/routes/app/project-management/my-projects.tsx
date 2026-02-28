import { QueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Calendar,
  Hash,
  ChevronRight as ArrowRight,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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

const ProjectCard = ({ project }: { project: Project }) => {
  const cfg = getStatusConfig(project.status);

  return (
    <Link
      to={paths.app.assignedProjects.detail.getHref(project.id)}
      className={`border-border bg-card group relative block overflow-hidden rounded-xl border border-l-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cfg.borderClass}`}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}
            >
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-foreground group-hover:text-primary text-base leading-tight font-semibold transition-colors">
                {project.name}
              </h3>
              <div className="mt-1 flex items-center gap-1">
                <Hash className="text-muted-foreground h-3 w-3" />
                <span className="text-muted-foreground font-mono text-xs">
                  {project.code}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}
            >
              {cfg.label}
            </span>
            <ArrowRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Footer: dates */}
        <div className="border-border/60 mt-4 flex flex-wrap items-center gap-3 border-t pt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground">Start:</span>
            <span className="text-foreground font-medium">
              {formatDate(project.startDate)}
            </span>
          </div>
          <span className="text-muted-foreground text-xs">→</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">End:</span>
            <span className="text-foreground font-medium">
              {formatDate(project.endDate)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ProjectCardSkeleton = () => (
  <div className="border-border border-l-muted bg-card rounded-xl border border-l-4 p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3.5 w-1/4" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="mt-3 h-8 w-full" />
    <div className="mt-4 flex gap-4 border-t pt-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

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

      {/* List */}
      {projectsQuery.isLoading ? (
        <div className="space-y-4">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : projects.length > 0 ? (
        <>
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {paging && paging.totalPages > 1 && (
            <div className="border-border mt-6 flex items-center justify-center gap-2 border-t pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('page', String(page - 1));
                    return next;
                  })
                }
                disabled={!paging.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="bg-muted text-muted-foreground flex items-center rounded-md px-3 py-1.5 text-sm font-medium">
                Page {paging.pageNumber} of {paging.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('page', String(page + 1));
                    return next;
                  })
                }
                disabled={!paging.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="border-border rounded-xl border border-dashed py-20 text-center">
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
    </ContentLayout>
  );
};

export default MyProjectsRoute;
