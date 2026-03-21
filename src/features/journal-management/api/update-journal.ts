import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  JOURNAL_MANAGEMENT_API,
  JOURNAL_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { UpdateJournalDto, BooleanApiUpdatedResponse } from '../types';

export type UpdateJournalPayload = {
  journalId: string;
  data: UpdateJournalDto;
};

export const updateJournal = ({
  journalId,
  data,
}: UpdateJournalPayload): Promise<BooleanApiUpdatedResponse> => {
  return api.put(JOURNAL_MANAGEMENT_API.ADMIN_JOURNAL_BY_ID(journalId), data);
};

type UseUpdateJournalOptions = {
  mutationConfig?: MutationConfig<typeof updateJournal>;
};

export const useUpdateJournal = ({
  mutationConfig,
}: UseUpdateJournalOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateJournal,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_MANAGEMENT_QUERY_KEYS.JOURNALS],
      });
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_MANAGEMENT_QUERY_KEYS.JOURNAL],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
