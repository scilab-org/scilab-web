import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  GAP_TYPE_MANAGEMENT_API,
  GAP_TYPE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetGapTypesResultApiResponse } from '../types';

export const getGapType = (
  gapTypeId: string,
): Promise<GetGapTypesResultApiResponse> => {
  return api.get(GAP_TYPE_MANAGEMENT_API.GAP_TYPE_BY_ID(gapTypeId));
};

export const getGapTypeQueryOptions = (gapTypeId: string) => {
  return queryOptions({
    queryKey: [GAP_TYPE_MANAGEMENT_QUERY_KEYS.GAP_TYPE, gapTypeId],
    queryFn: () => getGapType(gapTypeId),
  });
};

type UseGapTypeOptions = {
  gapTypeId: string;
  queryConfig?: QueryConfig<typeof getGapTypeQueryOptions>;
};

export const useGapType = ({ gapTypeId, queryConfig }: UseGapTypeOptions) => {
  return useQuery({
    ...getGapTypeQueryOptions(gapTypeId),
    ...queryConfig,
  });
};
