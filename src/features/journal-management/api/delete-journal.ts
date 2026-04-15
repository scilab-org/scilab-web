import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  JOURNAL_MANAGEMENT_API,
  JOURNAL_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteJournal = (
  journalId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(JOURNAL_MANAGEMENT_API.JOURNAL_BY_ID(journalId));
};

type UseDeleteJournalOptions = {
  mutationConfig?: MutationConfig<typeof deleteJournal>;
};

export const useDeleteJournal = ({
  mutationConfig,
}: UseDeleteJournalOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteJournal,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_MANAGEMENT_QUERY_KEYS.JOURNALS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
