import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  USER_AFFILIATION_MANAGEMENT_API,
  USER_AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  GetUserAffiliationsParams,
  GetUserAffiliationsResultApiResponse,
} from '../types';

export const getUserAffiliations = ({
  userId,
}: GetUserAffiliationsParams): Promise<GetUserAffiliationsResultApiResponse> => {
  return api.get(USER_AFFILIATION_MANAGEMENT_API.USER_AFFILIATIONS, {
    params: { userId },
  });
};

export const getUserAffiliationsQueryOptions = (userId: string) => {
  return queryOptions({
    queryKey: [
      USER_AFFILIATION_MANAGEMENT_QUERY_KEYS.USER_AFFILIATIONS,
      { userId },
    ],
    queryFn: () => getUserAffiliations({ userId }),
  });
};

type UseUserAffiliationsOptions = {
  userId: string;
  queryConfig?: QueryConfig<typeof getUserAffiliationsQueryOptions>;
};

export const useUserAffiliations = ({
  userId,
  queryConfig,
}: UseUserAffiliationsOptions) => {
  return useQuery({
    ...getUserAffiliationsQueryOptions(userId),
    ...queryConfig,
  });
};
