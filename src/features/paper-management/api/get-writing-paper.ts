import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetWritingPaperByIdResultApiResponse } from '../types';

export const getWritingPaper = ({
  paperId,
}: {
  paperId: string;
}): Promise<GetWritingPaperByIdResultApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.WRITING_PAPER_BY_ID(paperId));
};

export const getWritingPaperQueryOptions = (paperId: string) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.WRITING_PAPER, paperId],
    queryFn: () => getWritingPaper({ paperId }),
  });
};

type UseWritingPaperOptions = {
  paperId: string;
  queryConfig?: QueryConfig<typeof getWritingPaperQueryOptions>;
};

export const useWritingPaperDetail = ({
  paperId,
  queryConfig,
}: UseWritingPaperOptions) => {
  return useQuery({
    ...getWritingPaperQueryOptions(paperId),
    ...queryConfig,
  });
};
