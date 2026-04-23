import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  AUTHOR_ROLE_MANAGEMENT_API,
  AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  GetAuthorRolesParams,
  GetAuthorRolesResultApiResponse,
} from '../types';

export const getAuthorRoles = (
  params: GetAuthorRolesParams = {},
): Promise<GetAuthorRolesResultApiResponse> => {
  return api.get(AUTHOR_ROLE_MANAGEMENT_API.AUTHOR_ROLES, { params });
};

export const getAuthorRolesQueryOptions = (
  params: GetAuthorRolesParams = {},
) => {
  return queryOptions({
    queryKey: [AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS.AUTHOR_ROLES, params],
    queryFn: () => getAuthorRoles(params),
  });
};

type UseAuthorRolesOptions = {
  params?: GetAuthorRolesParams;
  queryConfig?: QueryConfig<typeof getAuthorRolesQueryOptions>;
};

export const useAuthorRoles = ({
  params = {},
  queryConfig,
}: UseAuthorRolesOptions = {}) => {
  return useQuery({
    ...getAuthorRolesQueryOptions(params),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
