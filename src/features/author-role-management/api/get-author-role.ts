import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  AUTHOR_ROLE_MANAGEMENT_API,
  AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetAuthorRolesResultApiResponse } from '../types';

export const getAuthorRole = (
  authorRoleId: string,
): Promise<GetAuthorRolesResultApiResponse> => {
  return api.get(AUTHOR_ROLE_MANAGEMENT_API.AUTHOR_ROLE_BY_ID(authorRoleId));
};

export const getAuthorRoleQueryOptions = (authorRoleId: string) => {
  return queryOptions({
    queryKey: [AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS.AUTHOR_ROLE, authorRoleId],
    queryFn: () => getAuthorRole(authorRoleId),
  });
};

type UseAuthorRoleOptions = {
  authorRoleId: string;
  queryConfig?: QueryConfig<typeof getAuthorRoleQueryOptions>;
};

export const useAuthorRole = ({
  authorRoleId,
  queryConfig,
}: UseAuthorRoleOptions) => {
  return useQuery({
    ...getAuthorRoleQueryOptions(authorRoleId),
    ...queryConfig,
  });
};
