import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreatePaperAuthorDto, StringApiCreatedResponse } from '../types';

export const createPaperAuthor = (
  data: CreatePaperAuthorDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(PAPER_MANAGEMENT_API.PAPER_AUTHORS, data);
};

type UseCreatePaperAuthorOptions = {
  mutationConfig?: MutationConfig<typeof createPaperAuthor>;
};

export const useCreatePaperAuthor = ({
  mutationConfig,
}: UseCreatePaperAuthorOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createPaperAuthor,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_AUTHORS],
      });
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.AVAILABLE_PAPER_AUTHORS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
