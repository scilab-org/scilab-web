import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  JOURNAL_MANAGEMENT_API,
  JOURNAL_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetJournalsResultApiResponse, GetJournalsParams } from '../types';

export const getJournals = (
  params: GetJournalsParams = {},
): Promise<GetJournalsResultApiResponse> => {
  return api.get(JOURNAL_MANAGEMENT_API.JOURNALS, { params });
};

export const getJournalsQueryOptions = (params: GetJournalsParams = {}) => {
  return queryOptions({
    queryKey: [JOURNAL_MANAGEMENT_QUERY_KEYS.JOURNALS, params],
    queryFn: () => getJournals(params),
  });
};

type UseJournalsOptions = {
  params?: GetJournalsParams;
  queryConfig?: QueryConfig<typeof getJournalsQueryOptions>;
};

export const useJournals = ({
  params = {},
  queryConfig,
}: UseJournalsOptions = {}) => {
  return useQuery({
    ...getJournalsQueryOptions(params),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
