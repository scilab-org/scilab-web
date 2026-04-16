import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPaperStatusHistoryApiResponse } from '../types';

export const getPaperStatusHistory = ({
  paperId,
}: {
  paperId: string;
}): Promise<GetPaperStatusHistoryApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPER_STATUS_HISTORY(paperId));
};

export const getPaperStatusHistoryQueryOptions = (paperId: string) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_STATUS_HISTORY, paperId],
    queryFn: () => getPaperStatusHistory({ paperId }),
    enabled: !!paperId,
  });
};

type UsePaperStatusHistoryOptions = {
  paperId: string;
  queryConfig?: QueryConfig<typeof getPaperStatusHistoryQueryOptions>;
};

export const usePaperStatusHistory = ({
  paperId,
  queryConfig,
}: UsePaperStatusHistoryOptions) => {
  return useQuery({
    ...getPaperStatusHistoryQueryOptions(paperId),
    ...queryConfig,
  });
};
