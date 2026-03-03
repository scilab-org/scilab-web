import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { InitializePaperDto, StringApiCreatedResponse } from '../types';

export const initializePaper = (
  data: InitializePaperDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(PAPER_MANAGEMENT_API.ADMIN_PAPERS_INITIALIZE, data);
};

type UseInitializePaperOptions = {
  mutationConfig?: MutationConfig<typeof initializePaper>;
};

export const useInitializePaper = ({
  mutationConfig,
}: UseInitializePaperOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: initializePaper,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
