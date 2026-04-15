import { QueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Search, X, FolderOpen } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
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
import { PROJECT_STATUS_OPTIONS } from '@/features/project-management/constants';
import { Project } from '@/features/project-management/types';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const code = url.searchParams.get('code') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const query = getMyProjectsQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Name: name,
      Code: code,
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
  text: string;
  variant: 'draft' | 'active' | 'completed' | 'archived' | 'outline';
};

const STATUS_MAP: Record<number, StatusConfig> = {
  1: {
    text: 'Draft',
    variant: 'draft',
  },
  2: {
    text: 'Active',
    variant: 'active',
  },
  3: {
    text: 'Completed',
    variant: 'completed',
  },
  4: {
    text: 'Archived',
    variant: 'archived',
  },
};

const getStatusConfig = (status: number): StatusConfig =>
  STATUS_MAP[status] ?? { text: 'Unknown', variant: 'outline' };

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const MyProjectsRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(searchParams.get('page') || 1);
  const name = searchParams.get('name') || '';
  const code = searchParams.get('code') || '';
  const status = searchParams.get('status') || '';

  const [filters, setFilters] = useState({
    name,
    code,
    status,
  });

  const handleApply = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.code) params.set('code', filters.code);
    if (filters.status) params.set('status', filters.status);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearName = () => {
    setFilters((prev) => ({ ...prev, name: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('name');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearCode = () => {
    setFilters((prev) => ({ ...prev, code: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('code');
    params.set('page', '1');
    setSearchParams(params);
  };

  const projectsQuery = useMyProjects({
    params: {
      PageNumber: page,
      PageSize: 10,
      Name: name || undefined,
      Code: code || undefined,
      Status: status || undefined,
    },
  });

  const projects: Project[] = (projectsQuery.data as any)?.result?.items ?? [];
  const paging = (projectsQuery.data as any)?.result?.paging;
  const hasFilters = !!(name || code || status);

  return (
    <ContentLayout
      title="Assigned Projects"
      description="Research projects you are a contributor to"
    >
      <form
        onSubmit={handleApply}
        className="flex flex-wrap items-center gap-2 rounded-md border bg-[#E9E1D8] p-2"
      >
        <div className="bg-background flex h-10 min-w-[200px] flex-1 items-center gap-3 rounded-md px-4">
          <Search className="text-muted-foreground size-4" />
          <Input
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
            placeholder="Search by project name..."
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          {filters.name && (
            <button
              type="button"
              onClick={handleClearName}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="bg-background flex h-10 min-w-[200px] flex-1 items-center gap-3 rounded-md px-4">
          <Search className="text-muted-foreground size-4" />
          <Input
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
            placeholder="Search by code..."
            value={filters.code}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, code: e.target.value }))
            }
          />
          {filters.code && (
            <button
              type="button"
              onClick={handleClearCode}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="bg-background h-10 w-48 rounded-md">
          <FilterDropdown
            value={filters.status}
            onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
            options={PROJECT_STATUS_OPTIONS.map((opt) => ({
              label: opt.label,
              value: String(opt.value),
            }))}
            placeholder="All status"
            className="h-10 w-full justify-between px-4 font-sans"
          />
        </div>

        <Button
          type="submit"
          variant="outline"
          className="border-input h-10 px-6 font-sans text-sm font-medium"
        >
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border shadow-sm">
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
                  <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                    <TableHead className="text-muted-foreground w-35">
                      Code
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Start Date
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      End Date
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const cfg = getStatusConfig(project.status);
                    return (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(
                            paths.app.assignedProjects.detail.getHref(
                              project.id,
                            ),
                          )
                        }
                      >
                        <TableCell className="text-foreground text-sm font-medium">
                          {project.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.text}</Badge>
                        </TableCell>
                        <TableCell>
                          {project.startDate
                            ? formatDate(project.startDate)
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {project.endDate ? formatDate(project.endDate) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={paths.app.assignedProjects.detail.getHref(
                              project.id,
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outlineAction" size="action">
                              VIEW
                            </Button>
                          </Link>
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
                  setFilters({ name: '', code: '', status: '' });
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
