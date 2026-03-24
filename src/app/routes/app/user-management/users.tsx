import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { getUsersQueryOptions } from '@/features/user-management/api/get-users';
import { CreateUser } from '@/features/user-management/components/create-user';
import { UsersFilter } from '@/features/user-management/components/users-filter';
import { UsersList } from '@/features/user-management/components/users-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const searchText = url.searchParams.get('search') || undefined;
    const groupName = url.searchParams.get('groupName') || undefined;
    const enabled = url.searchParams.get('enabled') || undefined;

    const query = getUsersQueryOptions({
      pageNumber: page,
      pageSize: 10,
      searchText,
      groupName,
      enabled,
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

const UsersRoute = () => {
  return (
    <ContentLayout title="User Management" description="Manage system users">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <CreateUser />
        </div>
        <UsersFilter />
      </div>

      <div className="mt-4">
        <UsersList />
      </div>
    </ContentLayout>
  );
};

export default UsersRoute;
