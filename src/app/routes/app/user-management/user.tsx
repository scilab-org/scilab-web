import { QueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useUserDetail,
  getUserQueryOptions,
} from '@/features/user-management/api/get-user';
import { UserView } from '@/features/user-management/components/user-view';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const userId = params.userId as string;

    const query = getUserQueryOptions(userId);

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

const UserRoute = () => {
  const params = useParams();
  const userId = params.userId as string;
  const userQuery = useUserDetail({ userId });

  if (userQuery.isLoading) {
    return (
      <ContentLayout title="User Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ContentLayout>
    );
  }

  const user = userQuery.data?.result?.user;

  if (!user) {
    return (
      <ContentLayout title="User Not Found">
        <p className="text-muted-foreground">
          The requested user could not be found.
        </p>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      title={`${user.firstName || ''} ${user.lastName || ''} (${user.username})`}
    >
      <UserView userId={userId} />
    </ContentLayout>
  );
};

export default UserRoute;
