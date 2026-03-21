import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  JOURNAL_MANAGEMENT_API,
  JOURNAL_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetJournalByIdResultApiResponse } from '../types';

export const getJournal = (
  journalId: string,
): Promise<GetJournalByIdResultApiResponse> => {
  return api.get(JOURNAL_MANAGEMENT_API.JOURNAL_BY_ID(journalId));
};

export const getJournalQueryOptions = (journalId: string) => {
  return queryOptions({
    queryKey: [JOURNAL_MANAGEMENT_QUERY_KEYS.JOURNAL, journalId],
    queryFn: () => getJournal(journalId),
  });
};

type UseJournalOptions = {
  journalId: string;
  queryConfig?: QueryConfig<typeof getJournalQueryOptions>;
};

export const useJournal = ({ journalId, queryConfig }: UseJournalOptions) => {
  return useQuery({
    ...getJournalQueryOptions(journalId),
    ...queryConfig,
  });
};
