import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPaperContributorsApiResponse } from '../types';

type GetPaperAuthorsParams = {
  PaperId?: string;
  PageNumber?: number;
  PageSize?: number;
};

export const getPaperAuthors = ({
  params = {},
}: {
  params?: GetPaperAuthorsParams;
}): Promise<GetPaperContributorsApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPER_AUTHORS, { params });
};

export const getPaperAuthorsQueryOptions = (
  params: GetPaperAuthorsParams = {},
) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_AUTHORS, params],
    queryFn: () => getPaperAuthors({ params }),
  });
};

export const useGetPaperAuthors = ({
  params = {},
  queryConfig,
}: {
  params?: GetPaperAuthorsParams;
  queryConfig?: QueryConfig<typeof getPaperAuthorsQueryOptions>;
}) => {
  return useQuery({
    ...getPaperAuthorsQueryOptions(params),
    ...queryConfig,
  });
};
