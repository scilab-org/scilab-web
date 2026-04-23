import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  DOMAIN_MANAGEMENT_API,
  DOMAIN_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetDomainsResultApiResponse } from '../types';

export const getDomain = (
  domainId: string,
): Promise<GetDomainsResultApiResponse> => {
  return api.get(DOMAIN_MANAGEMENT_API.DOMAIN_BY_ID(domainId));
};

export const getDomainQueryOptions = (domainId: string) => {
  return queryOptions({
    queryKey: [DOMAIN_MANAGEMENT_QUERY_KEYS.DOMAIN, domainId],
    queryFn: () => getDomain(domainId),
  });
};

type UseDomainOptions = {
  domainId: string;
  queryConfig?: QueryConfig<typeof getDomainQueryOptions>;
};

export const useDomain = ({ domainId, queryConfig }: UseDomainOptions) => {
  return useQuery({
    ...getDomainQueryOptions(domainId),
    ...queryConfig,
  });
};
