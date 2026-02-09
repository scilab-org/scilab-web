import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { GetUserByIdResultApiGetResponse } from '../types';

export const getUser = ({
  userId,
}: {
  userId: string;
}): Promise<GetUserByIdResultApiGetResponse> => {
  return api.get(USER_MANAGEMENT_API.USER_BY_ID(userId));
};

export const getUserQueryOptions = (userId: string) => {
  return queryOptions({
    queryKey: [USER_MANAGEMENT_QUERY_KEYS.USER, userId],
    queryFn: () => getUser({ userId }),
  });
};

type UseUserOptions = {
  userId: string;
  queryConfig?: QueryConfig<typeof getUserQueryOptions>;
};

export const useUserDetail = ({ userId, queryConfig }: UseUserOptions) => {
  return useQuery({
    ...getUserQueryOptions(userId),
    ...queryConfig,
  });
};
