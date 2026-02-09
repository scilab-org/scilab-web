import { QueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Skeleton } from '@/components/ui/skeleton';
import { getGroupRolesQueryOptions } from '@/features/group-role-management/api/get-group-roles';
import {
  useGroups,
  getGroupsQueryOptions,
} from '@/features/group-role-management/api/get-groups';
import { GroupRolesView } from '@/features/group-role-management/components/group-roles-view';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const groupId = params.groupId as string;

    const groupsQuery = getGroupsQueryOptions();
    const rolesQuery = getGroupRolesQueryOptions(groupId);

    const promises = [
      queryClient.getQueryData(groupsQuery.queryKey) ??
        (await queryClient.fetchQuery(groupsQuery)),
      queryClient.getQueryData(rolesQuery.queryKey) ??
        (await queryClient.fetchQuery(rolesQuery)),
    ] as const;

    const [groups, roles] = await Promise.all(promises);

    return { groups, roles };
  };

const GroupRoute = () => {
  const params = useParams();
  const groupId = params.groupId as string;

  const groupsQuery = useGroups();

  if (groupsQuery.isLoading) {
    return (
      <ContentLayout title="Group Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ContentLayout>
    );
  }

  // Find group name from the groups list
  const findGroup = (
    groups: any[],
    id: string,
  ): { name: string } | undefined => {
    for (const g of groups) {
      if (g.id === id) return g;
      if (g.subGroups) {
        const found = findGroup(g.subGroups, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const group = groupsQuery.data?.result
    ? findGroup(groupsQuery.data.result, groupId)
    : undefined;

  return (
    <ContentLayout
      title={group ? `Group: ${group.name}` : 'Group Details'}
      description="Manage role assignments for this group"
    >
      <GroupRolesView groupId={groupId} />
    </ContentLayout>
  );
};

export default GroupRoute;
