import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export const deletePaperAuthor = (id: string): Promise<unknown> => {
  return api.delete(`${PAPER_MANAGEMENT_API.PAPER_AUTHORS}/${id}`);
};

export const useDeletePaperAuthor = ({
  mutationConfig,
}: {
  mutationConfig?: any;
} = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (id: string) => deletePaperAuthor(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_AUTHORS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
