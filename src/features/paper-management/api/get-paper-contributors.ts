import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPaperContributorsApiResponse } from '../types';

export const getPaperContributors = ({
  paperId,
}: {
  paperId: string;
}): Promise<GetPaperContributorsApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPER_CONTRIBUTORS_BY_PAPER(paperId));
};

export const getPaperContributorsQueryOptions = (paperId: string) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_CONTRIBUTORS, paperId],
    queryFn: () => getPaperContributors({ paperId }),
    enabled: !!paperId,
  });
};

export const useGetPaperContributors = ({
  paperId,
  queryConfig,
}: {
  paperId: string;
  queryConfig?: QueryConfig<typeof getPaperContributorsQueryOptions>;
}) => {
  return useQuery({
    ...getPaperContributorsQueryOptions(paperId),
    ...queryConfig,
  });
};
