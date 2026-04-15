import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getGroupsQueryOptions } from '@/features/group-role-management/api/get-groups';
import { GroupsList } from '@/features/group-role-management/components/groups-list';

export const clientLoader = (queryClient: QueryClient) => async () => {
  const query = getGroupsQueryOptions();

  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  );
};

const GroupsRoute = () => {
  return (
    <>
      <Head title="Groups & Roles" />
      <ContentLayout
        title="Groups & Roles"
        description="Manage groups and their role assignments"
      >
        <GroupsList />
      </ContentLayout>
    </>
  );
};

export default GroupsRoute;
