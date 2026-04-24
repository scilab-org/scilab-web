import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreatePaperAuthorDto } from '../types';

type UpdatePaperAuthorVariables = {
  id: string;
  data: CreatePaperAuthorDto;
};

export const updatePaperAuthor = ({
  id,
  data,
}: UpdatePaperAuthorVariables): Promise<unknown> => {
  return api.put(`${PAPER_MANAGEMENT_API.PAPER_AUTHORS}/${id}`, data);
};

type UseUpdatePaperAuthorOptions = {
  mutationConfig?: MutationConfig<typeof updatePaperAuthor>;
};

export const useUpdatePaperAuthor = ({
  mutationConfig,
}: UseUpdatePaperAuthorOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updatePaperAuthor,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_AUTHORS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
