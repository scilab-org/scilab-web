import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  AFFILIATION_MANAGEMENT_API,
  AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  GetAffiliationsParams,
  GetAffiliationsResultApiResponse,
} from '../types';

export const getAffiliations = (
  params: GetAffiliationsParams = {},
): Promise<GetAffiliationsResultApiResponse> => {
  return api.get(AFFILIATION_MANAGEMENT_API.AFFILIATIONS, { params });
};

export const getAffiliationsQueryOptions = (
  params: GetAffiliationsParams = {},
) => {
  return queryOptions({
    queryKey: [AFFILIATION_MANAGEMENT_QUERY_KEYS.AFFILIATIONS, params],
    queryFn: () => getAffiliations(params),
  });
};

type UseAffiliationsOptions = {
  params?: GetAffiliationsParams;
  queryConfig?: QueryConfig<typeof getAffiliationsQueryOptions>;
};

export const useAffiliations = ({
  params = {},
  queryConfig,
}: UseAffiliationsOptions = {}) => {
  return useQuery({
    ...getAffiliationsQueryOptions(params),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
