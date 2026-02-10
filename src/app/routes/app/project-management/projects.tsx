import { QueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Input } from '@/components/ui/input';
import { getProjectsQueryOptions } from '@/features/project-management/api/get-projects';
import { CreateProject } from '@/features/project-management/components/create-project';
import { ProjectsList } from '@/features/project-management/components/projects-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const searchText = url.searchParams.get('search') || undefined;
    const pageSize = Number(url.searchParams.get('pageSize') || 10);

    const query = getProjectsQueryOptions({
      pageNumber: page,
      searchText,
      pageSize,
    });

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

const ProjectsRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = searchParams.get('search') || '';
  const pageSize = searchParams.get('pageSize') || '10';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newSearchParams.set('search', e.target.value);
    } else {
      newSearchParams.delete('search');
    }
    newSearchParams.delete('page'); // Reset to page 1
    setSearchParams(newSearchParams);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('pageSize', e.target.value);
    newSearchParams.delete('page'); // Reset to page 1
    setSearchParams(newSearchParams);
  };

  return (
    <ContentLayout
      title="Research Projects"
      description="Manage and track your scientific research projects"
    >
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <Input
              placeholder="Search projects by name or code..."
              value={searchText}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="pageSize"
                className="text-muted-foreground text-sm"
              >
                Show:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-2"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <CreateProject />
        </div>
      </div>

      <ProjectsList />
    </ContentLayout>
  );
};

export default ProjectsRoute;
