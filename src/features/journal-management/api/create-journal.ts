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
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('issn', data.issn);
  data.templateIds.forEach((id) => formData.append('templateIds', id));
  formData.append('ranking', data.ranking);
  formData.append('url', data.url);
  formData.append('style', data.style);
  formData.append('type', String(data.type));

  if (data.texFile) {
    formData.append('texFile', data.texFile);
  }

  if (data.pdfFile) {
    formData.append('pdfFile', data.pdfFile);
  }

  return api.post(JOURNAL_MANAGEMENT_API.JOURNALS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
