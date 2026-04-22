import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdatePaperDto } from '../types';

export type UpdatePaperPayload = {
  paperId: string;
  data: UpdatePaperDto;
};

export const updatePaper = ({
  paperId,
  data,
}: UpdatePaperPayload): Promise<BooleanApiUpdatedResponse> => {
  const formData = new FormData();
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.abstract !== undefined) formData.append('abstract', data.abstract);
  if (data.doi !== undefined) formData.append('doi', data.doi);
  if (data.authors !== undefined) formData.append('authors', data.authors);
  if (data.publisher !== undefined)
    formData.append('publisher', data.publisher);
  if (data.number !== undefined) formData.append('number', data.number);
  if (data.publicationDate)
    formData.append('publicationDate', data.publicationDate);
  if (data.paperType !== undefined)
    formData.append('paperType', data.paperType);
  if (data.conferenceJournalId !== undefined)
    formData.append('conferenceJournalId', data.conferenceJournalId);
  if (data.pages !== undefined) formData.append('pages', data.pages);
  if (data.volume !== undefined) formData.append('volume', data.volume);
  if (data.referenceContent !== undefined)
    formData.append('referenceContent', data.referenceContent);
  if (data.ranking !== undefined) formData.append('ranking', data.ranking);
  if (data.url !== undefined) formData.append('url', data.url);
  if (data.bibFile) formData.append('bibFile', data.bibFile);
  if (data.keywords) {
    data.keywords.forEach((kw) => formData.append('keywords', kw));
  }
  if (data.isAutoTagged !== undefined)
    formData.append('isAutoTagged', data.isAutoTagged.toString());
  if (data.isIngested !== undefined)
    formData.append('isIngested', data.isIngested.toString());

  return api.put(PAPER_MANAGEMENT_API.ADMIN_PAPER_BY_ID(paperId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

type UseUpdatePaperOptions = {
  mutationConfig?: MutationConfig<typeof updatePaper>;
};

export const useUpdatePaper = ({
  mutationConfig,
}: UseUpdatePaperOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updatePaper,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
      });
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
