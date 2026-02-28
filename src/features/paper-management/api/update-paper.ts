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
  if (data.publicationDate)
    formData.append('publicationDate', data.publicationDate);
  if (data.paperType !== undefined)
    formData.append('paperType', data.paperType);
  if (data.journalName !== undefined)
    formData.append('journalName', data.journalName);
  if (data.conferenceName !== undefined)
    formData.append('conferenceName', data.conferenceName);
  if (data.status !== undefined)
    formData.append('status', data.status.toString());
  if (data.tagNames) {
    data.tagNames.forEach((tag) => formData.append('tagNames', tag));
  }
  if (data.isAutoTagged !== undefined)
    formData.append('isAutoTagged', data.isAutoTagged.toString());

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
