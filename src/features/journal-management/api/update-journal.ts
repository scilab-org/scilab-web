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
  const formData = new FormData();

  if (typeof data.name === 'string') {
    formData.append('name', data.name);
  }

  if (typeof data.issn === 'string') {
    formData.append('issn', data.issn);
  }

  if (typeof data.ranking === 'string') {
    formData.append('ranking', data.ranking);
  }

  if (typeof data.url === 'string') {
    formData.append('url', data.url);
  }

  if (typeof data.style === 'string') {
    formData.append('style', data.style);
  }

  if (typeof data.type === 'number') {
    formData.append('type', String(data.type));
  }

  if (data.templateIds) {
    data.templateIds.forEach((id) => formData.append('templateIds', id));
  }

  if (data.texFile) {
    formData.append('texFile', data.texFile);
  }

  if (data.pdfFile) {
    formData.append('pdfFile', data.pdfFile);
  }

  return api.put(JOURNAL_MANAGEMENT_API.JOURNAL_BY_ID(journalId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
