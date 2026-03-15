import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreatePaperDto, StringApiCreatedResponse } from '../types';

export const createPaper = (
  data: CreatePaperDto,
): Promise<StringApiCreatedResponse> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('abstract', data.abstract);
  formData.append('doi', data.doi);
  if (data.publicationDate) {
    formData.append('publicationDate', data.publicationDate);
  }
  formData.append('paperType', data.paperType);
  formData.append('journalName', data.journalName);
  formData.append('conferenceName', data.conferenceName);
  formData.append('file', data.file);
  formData.append('parsedText', JSON.stringify(data.parsedText));
  formData.append('isAutoTagged', String(data.isAutoTagged));
  formData.append('isIngested', String(data.isIngested));
  formData.append('status', String(data.status));
  data.tagNames.forEach((tag) => formData.append('tagNames', tag));

  return api.post(PAPER_MANAGEMENT_API.ADMIN_PAPERS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

type UseCreatePaperOptions = {
  mutationConfig?: MutationConfig<typeof createPaper>;
};

export const useCreatePaper = ({
  mutationConfig,
}: UseCreatePaperOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createPaper,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
