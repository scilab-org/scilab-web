import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  JOURNAL_MANAGEMENT_API,
  JOURNAL_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateJournalDto, StringApiCreatedResponse } from '../types';

export const createJournal = (
  data: CreateJournalDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(JOURNAL_MANAGEMENT_API.ADMIN_JOURNALS, { dto: data });
};

type UseCreateJournalOptions = {
  mutationConfig?: MutationConfig<typeof createJournal>;
};

export const useCreateJournal = ({
  mutationConfig,
}: UseCreateJournalOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createJournal,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [JOURNAL_MANAGEMENT_QUERY_KEYS.JOURNALS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
