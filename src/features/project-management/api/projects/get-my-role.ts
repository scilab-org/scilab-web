import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

export type MyRoleResponse = {
  result: string;
};

export const getMyRole = ({
  projectId,
}: {
  projectId: string;
}): Promise<MyRoleResponse> => {
  return api.get(PROJECT_MANAGEMENT_API.MY_ROLE(projectId));
};

export const getMyRoleQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.MY_ROLE, projectId],
    queryFn: () => getMyRole({ projectId }),
  });
};

type UseMyRoleOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getMyRoleQueryOptions>;
};

export const useMyProjectRole = ({
  projectId,
  queryConfig,
}: UseMyRoleOptions) => {
  return useQuery({
    ...getMyRoleQueryOptions(projectId),
    ...queryConfig,
  });
};
