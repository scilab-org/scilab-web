import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deletePaper = ({
  paperId,
}: {
  paperId: string;
}): Promise<BooleanApiDeletedResponse> => {
  return api.delete(PAPER_MANAGEMENT_API.ADMIN_PAPER_BY_ID(paperId));
};

type UseDeletePaperOptions = {
  mutationConfig?: MutationConfig<typeof deletePaper>;
};

export const useDeletePaper = ({
  mutationConfig,
}: UseDeletePaperOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deletePaper,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
