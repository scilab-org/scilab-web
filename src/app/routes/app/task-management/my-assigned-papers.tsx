import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, type FormEvent } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useState } from 'react';
import { getWritingPaperQueryOptions } from '@/features/paper-management/api/get-writing-paper';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
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

import { Badge } from '@/components/ui/badge';
import { paths } from '@/config/paths';
import { useMyAssignedPapers } from '@/features/task-management/api/get-my-assigned-papers';
import { useMyProjects } from '@/features/project-management/api/projects/get-my-projects';
import { SUBMISSION_STATUS_LABELS } from '@/features/paper-management/constants';

const PAGE_SIZE = 10;

const SUBMISSION_STATUS_OPTIONS = [
  { label: 'Draft', value: '1' },
  { label: 'Submitted', value: '2' },
  { label: 'Revision Required', value: '3' },
  { label: 'Resubmitted', value: '4' },
  { label: 'Accepted', value: '5' },
  { label: 'Published', value: '6' },
  { label: 'Rejected', value: '7' },
];

type BadgeVariant = 'draft' | 'active' | 'outline' | 'success' | 'secondary';

const getSubmissionStatusVariant = (status: number | null): BadgeVariant => {
  switch (status) {
    case 1:
      return 'draft';
    case 2:
      return 'active';
    case 3:
      return 'outline';
    case 4:
      return 'active';
    case 5:
      return 'success';
    case 6:
      return 'success';
    case 7:
      return 'secondary';
    default:
      return 'draft';
  }
};

const MyAssignedPapersRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loadingPaperId, setLoadingPaperId] = useState<string | null>(null);

  const handleViewPaper = useCallback(
    async (paperId: string, knownProjectId?: string) => {
      if (knownProjectId) {
        navigate(
          paths.app.assignedProjects.paperDetail.getHref(
            knownProjectId,
            paperId,
          ),
        );
        return;
      }
      setLoadingPaperId(paperId);
      try {
        const res = await queryClient.fetchQuery(
          getWritingPaperQueryOptions(paperId),
        );
        const projectId = (res as any)?.result?.paper?.subProjectId;
        if (projectId) {
          navigate(
            paths.app.assignedProjects.paperDetail.getHref(projectId, paperId),
          );
        }
      } finally {
        setLoadingPaperId(null);
      }
    },
    [navigate, queryClient],
  );

  const page = Number(searchParams.get('page') || 1);
  const titleParam = searchParams.get('title') || '';
  const projectCodeParam = searchParams.get('projectCode') || '';
  const statusParam = searchParams.get('status') || '';

  const [filters, setFilters] = useState({
    title: titleParam,
    projectCode: projectCodeParam,
    status: statusParam,
  });

  // Load all assigned projects for the dropdown
  const myProjectsQuery = useMyProjects({
    params: { PageNumber: 1, PageSize: 1000 },
  });
  const projectOptions = useMemo(() => {
    const items: Array<{ name: string; code: string }> =
      (myProjectsQuery.data as any)?.result?.items ?? [];
    return items.map((p) => ({
      label: `${p.code} — ${p.name}`,
      value: p.code,
    }));
  }, [myProjectsQuery.data]);

  const papersQuery = useMyAssignedPapers({
    params: {
      PageNumber: page,
      PageSize: PAGE_SIZE,
      title: titleParam || undefined,
      ProjectCode: projectCodeParam || undefined,
    },
  });

  const papers: Array<any> = (papersQuery.data as any)?.result?.items ?? [];
  const paging = (papersQuery.data as any)?.result?.paging;
  const totalPages: number = paging?.totalPages ?? 1;
  const totalCount: number = paging?.totalCount ?? papers.length;

  const handleApply = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.title) params.set('title', filters.title);
    if (filters.projectCode) params.set('projectCode', filters.projectCode);
    if (filters.status) params.set('status', filters.status);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearTitle = () => {
    setFilters((prev) => ({ ...prev, title: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('title');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearProject = () => {
    setFilters((prev) => ({ ...prev, projectCode: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('projectCode');
    params.set('page', '1');
    setSearchParams(params);
  };

  const hasFilters = !!(titleParam || projectCodeParam || statusParam);

  // Filter by submission status client-side
  const filteredPapers = statusParam
    ? papers.filter((p) => String(p.submissionStatus ?? 1) === statusParam)
    : papers;

  return (
    <>
      <Head title="Assigned Papers" />
      <ContentLayout
        title="Assigned Papers"
        description="Research papers you are assigned to contribute to"
      >
        {/* Filter bar */}
        <form
          onSubmit={handleApply}
          className="flex flex-wrap items-center gap-2 rounded-md border bg-[#E9E1D8] p-2"
        >
          {/* Title */}
          <div className="bg-background flex h-10 min-w-50 flex-1 items-center gap-3 rounded-md px-4">
            <Search className="text-muted-foreground size-4" />
            <Input
              className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
              placeholder="Search by paper title..."
              value={filters.title}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            {filters.title && (
              <button
                type="button"
                onClick={handleClearTitle}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Project dropdown (search by code) */}
          <div className="bg-background h-10 w-56 rounded-md">
            <FilterDropdown
              value={filters.projectCode}
              onChange={(v) => {
                setFilters((prev) => ({ ...prev, projectCode: v }));
              }}
              options={projectOptions}
              placeholder="All projects"
              className="h-10 w-full justify-between px-4 font-sans"
            />
            {filters.projectCode && <input type="hidden" />}
          </div>
          {filters.projectCode && (
            <button
              type="button"
              onClick={handleClearProject}
              className="text-muted-foreground hover:text-foreground -ml-1"
              title="Clear project filter"
            >
              <X className="size-4" />
            </button>
          )}

          {/* Status filter */}
          <div className="bg-background h-10 w-40 rounded-md">
            <FilterDropdown
              value={filters.status}
              onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
              options={SUBMISSION_STATUS_OPTIONS}
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
          {papersQuery.isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredPapers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                      <TableHead className="text-muted-foreground w-[40%]">
                        Title
                      </TableHead>
                      <TableHead className="text-muted-foreground w-[12%]">
                        Project
                      </TableHead>
                      <TableHead className="text-muted-foreground w-[12%]">
                        Template
                      </TableHead>
                      <TableHead className="text-muted-foreground w-[16%]">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground w-[20%] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPapers.map((paper) => {
                      const projectId: string | undefined =
                        paper.projectId ?? paper.subProjectId ?? undefined;
                      const status: number = paper.submissionStatus ?? 1;
                      const projectCode: string = paper.projectCode ?? '—';
                      const template: string = paper.template ?? '—';

                      return (
                        <TableRow key={paper.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <span
                              className="block truncate"
                              title={paper.title || '(Untitled)'}
                            >
                              {paper.title || '(Untitled)'}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {projectCode}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {template}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSubmissionStatusVariant(status)}>
                              {SUBMISSION_STATUS_LABELS[status] ?? 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="action"
                              variant="outline"
                              disabled={loadingPaperId === paper.id}
                              onClick={() =>
                                handleViewPaper(paper.id, projectId)
                              }
                            >
                              {loadingPaperId === paper.id
                                ? 'Loading...'
                                : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  paging={{
                    pageNumber: page,
                    totalPages,
                    totalCount,
                    hasPreviousPage: page > 1,
                    hasNextPage: page < totalPages,
                  }}
                />
              )}
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <FileText className="text-muted-foreground size-10 opacity-40" />
              <p className="text-muted-foreground text-sm">
                {hasFilters
                  ? 'No papers match your filters.'
                  : 'No assigned papers found.'}
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({ title: '', projectCode: '', status: '' });
                    setSearchParams(new URLSearchParams({ page: '1' }));
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </ContentLayout>
    </>
  );
};

export default MyAssignedPapersRoute;
