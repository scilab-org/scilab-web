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
  formData.append('authors', data.authors);
  formData.append('publisher', data.publisher);
  formData.append('number', data.number);
  if (data.publicationDate) {
    formData.append('publicationDate', data.publicationDate);
  }
  data.gapTypeIds.forEach((gapTypeId) => {
    formData.append('gapTypeIds', gapTypeId);
  });
  if (data.conferenceJournalId) {
    formData.append('conferenceJournalId', data.conferenceJournalId);
  }
  formData.append('pages', data.pages);
  formData.append('volume', data.volume);
  formData.append('referenceContent', data.referenceContent);
  formData.append('pdfFile', data.pdfFile);
  if (data.bibFile) {
    formData.append('bibFile', data.bibFile);
  }
  formData.append('parsedText', String(data.parsedText ?? ''));
  formData.append('isAutoTagged', String(data.isAutoTagged));
  formData.append('isIngested', String(data.isIngested));
  if (data.ranking) formData.append('ranking', data.ranking);
  if (data.url) formData.append('url', data.url);
  data.keywords.forEach((kw) => formData.append('keywords', kw));

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
