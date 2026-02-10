import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPaperByIdResultApiResponse } from '../types';

export const getPaper = ({
  paperId,
}: {
  paperId: string;
}): Promise<GetPaperByIdResultApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPER_BY_ID(paperId));
};

export const getPaperQueryOptions = (paperId: string) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER, paperId],
    queryFn: () => getPaper({ paperId }),
  });
};

type UsePaperOptions = {
  paperId: string;
  queryConfig?: QueryConfig<typeof getPaperQueryOptions>;
};

export const usePaperDetail = ({ paperId, queryConfig }: UsePaperOptions) => {
  return useQuery({
    ...getPaperQueryOptions(paperId),
    ...queryConfig,
  });
};
