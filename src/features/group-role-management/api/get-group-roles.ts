import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { GROUP_ROLE_API, GROUP_ROLE_QUERY_KEYS } from '../constants';
import { RoleDtoListApiGetResponse } from '../types';

export const getGroupRoles = ({
  groupId,
}: {
  groupId: string;
}): Promise<RoleDtoListApiGetResponse> => {
  return api.get(GROUP_ROLE_API.GROUP_ROLES(groupId));
};

export const getGroupRolesQueryOptions = (groupId: string) => {
  return queryOptions({
    queryKey: [GROUP_ROLE_QUERY_KEYS.GROUP_ROLES, groupId],
    queryFn: () => getGroupRoles({ groupId }),
  });
};

type UseGroupRolesOptions = {
  groupId: string;
  queryConfig?: QueryConfig<typeof getGroupRolesQueryOptions>;
};

export const useGroupRoles = ({
  groupId,
  queryConfig,
}: UseGroupRolesOptions) => {
  return useQuery({
    ...getGroupRolesQueryOptions(groupId),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
