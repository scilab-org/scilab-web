import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  GAP_TYPE_MANAGEMENT_API,
  GAP_TYPE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetGapTypesParams, GetGapTypesResultApiResponse } from '../types';

export const getGapTypes = (
  params: GetGapTypesParams = {},
): Promise<GetGapTypesResultApiResponse> => {
  return api.get(GAP_TYPE_MANAGEMENT_API.GAP_TYPES, { params });
};

export const getGapTypesQueryOptions = (params: GetGapTypesParams = {}) => {
  return queryOptions({
    queryKey: [GAP_TYPE_MANAGEMENT_QUERY_KEYS.GAP_TYPES, params],
    queryFn: () => getGapTypes(params),
  });
};

type UseGapTypesOptions = {
  params?: GetGapTypesParams;
  queryConfig?: QueryConfig<typeof getGapTypesQueryOptions>;
};

export const useGapTypes = ({
  params = {},
  queryConfig,
}: UseGapTypesOptions = {}) => {
  return useQuery({
    ...getGapTypesQueryOptions(params),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
