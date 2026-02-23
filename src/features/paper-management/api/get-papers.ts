import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPapersResultApiResponse, GetPapersParams } from '../types';

export const getPapers = (
  params: GetPapersParams = {},
): Promise<GetPapersResultApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPERS, {
    params,
    paramsSerializer: {
      indexes: null, // serialize arrays as Tag=a&Tag=b (no brackets)
    },
  });
};

export const getPapersQueryOptions = (params: GetPapersParams = {}) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS, params],
    queryFn: () => getPapers(params),
  });
};

type UsePapersOptions = {
  params?: GetPapersParams;
  queryConfig?: QueryConfig<typeof getPapersQueryOptions>;
};

export const usePapers = ({
  params = {},
  queryConfig,
}: UsePapersOptions = {}) => {
  return useQuery({
    ...getPapersQueryOptions(params),
    ...queryConfig,
  });
};
