import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { GetUsersResultApiGetResponse, GetUsersParams } from '../types';

export const getUsers = (
  params: GetUsersParams = {},
): Promise<GetUsersResultApiGetResponse> => {
  return api.get(USER_MANAGEMENT_API.USERS, { params });
};

export const getUsersQueryOptions = (params: GetUsersParams = {}) => {
  return queryOptions({
    queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS, params],
    queryFn: () => getUsers(params),
  });
};

type UseUsersOptions = {
  params?: GetUsersParams;
  queryConfig?: QueryConfig<typeof getUsersQueryOptions>;
};

export const useUsers = ({
  params = {},
  queryConfig,
}: UseUsersOptions = {}) => {
  return useQuery({
    ...getUsersQueryOptions(params),
    ...queryConfig,
  });
};
