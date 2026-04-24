import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  DOMAIN_MANAGEMENT_API,
  DOMAIN_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetDomainsParams, GetDomainsResultApiResponse } from '../types';

export const getDomains = (
  params: GetDomainsParams = {},
): Promise<GetDomainsResultApiResponse> => {
  return api.get(DOMAIN_MANAGEMENT_API.DOMAINS, { params });
};

export const getDomainsQueryOptions = (params: GetDomainsParams = {}) => {
  return queryOptions({
    queryKey: [DOMAIN_MANAGEMENT_QUERY_KEYS.DOMAINS, params],
    queryFn: () => getDomains(params),
  });
};

type UseDomainsOptions = {
  params?: GetDomainsParams;
  queryConfig?: QueryConfig<typeof getDomainsQueryOptions>;
};

export const useDomains = ({
  params = {},
  queryConfig,
}: UseDomainsOptions = {}) => {
  return useQuery({
    ...getDomainsQueryOptions(params),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
