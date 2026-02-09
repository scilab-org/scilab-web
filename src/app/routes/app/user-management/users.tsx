import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { getUsersQueryOptions } from '@/features/user-management/api/get-users';
import { CreateUser } from '@/features/user-management/components/create-user';
import { UsersList } from '@/features/user-management/components/users-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const searchText = url.searchParams.get('search') || undefined;

    const query = getUsersQueryOptions({ pageNumber: page, searchText });

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

const UsersRoute = () => {
  return (
    <ContentLayout title="User Management" description="Manage system users">
      <div className="flex justify-end">
        <CreateUser />
      </div>
      <div className="mt-4">
        <UsersList />
      </div>
    </ContentLayout>
  );
};

export default UsersRoute;
