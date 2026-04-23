import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getAuthorRolesQueryOptions } from '@/features/author-role-management/api/get-author-roles';
import { CreateAuthorRole } from '@/features/author-role-management/components/create-author-role';
import { AuthorRolesFilter } from '@/features/author-role-management/components/author-roles-filter';
import { AuthorRolesList } from '@/features/author-role-management/components/author-roles-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;

    const query = getAuthorRolesQueryOptions({
      Name: name,
      PageNumber: page,
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

const AuthorRolesRoute = () => {
  return (
    <>
      <Head title="Author Role Management" />
      <ContentLayout
        title="Author Role Management"
        description="Manage author roles"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateAuthorRole />
          </div>
          <AuthorRolesFilter />
        </div>
        <div className="mt-4">
          <AuthorRolesList />
        </div>
      </ContentLayout>
    </>
  );
};

export default AuthorRolesRoute;
