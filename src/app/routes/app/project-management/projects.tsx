import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getProjectsQueryOptions } from '@/features/project-management/api/projects/get-projects';
import { CreateProject } from '@/features/project-management/components/projects/create-project';
import { ProjectsList } from '@/features/project-management/components/projects/projects-list';
import { ProjectsFilter } from '@/features/project-management/components/projects/projects-filter';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const code = url.searchParams.get('code') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const isDeleted = url.searchParams.get('isDeleted') || 'false';

    const query = getProjectsQueryOptions({
      PageNumber: page,
      Name: name,
      Code: code,
      Status: status,
      IsDeleted: isDeleted,
      PageSize: 10,
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

const ProjectsRoute = () => {
  return (
    <>
      <Head title="Research Projects" />
      <ContentLayout
        title="Research Projects"
        description="Manage and track your scientific research projects"
      >
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <CreateProject />
        </div>
        <ProjectsFilter />
      </div>

      <div className="mt-4">
        <ProjectsList />
      </div>
    </ContentLayout>
    </>
  );
};

export default ProjectsRoute;
