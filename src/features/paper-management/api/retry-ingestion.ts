import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export const retryIngestion = ({
  paperId,
}: {
  paperId: string;
}): Promise<unknown> => {
  return api.post(PAPER_MANAGEMENT_API.ADMIN_PAPER_RETRY_INGESTION(paperId));
};

type UseRetryIngestionOptions = {
  paperId: string;
  mutationConfig?: MutationConfig<typeof retryIngestion>;
};

export const useRetryIngestion = ({
  paperId,
  mutationConfig,
}: UseRetryIngestionOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: retryIngestion,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER, paperId],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
