import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  TransitionPaperStatusDto,
  TransitionPaperStatusApiResponse,
} from '../types';

export const transitionPaperStatus = ({
  paperId,
  data,
}: {
  paperId: string;
  data: TransitionPaperStatusDto;
}): Promise<TransitionPaperStatusApiResponse> => {
  return api.post(PAPER_MANAGEMENT_API.PAPER_STATUS_TRANSITION(paperId), data);
};

type UseTransitionPaperStatusOptions = {
  paperId: string;
  mutationConfig?: Omit<
    UseMutationOptions<
      TransitionPaperStatusApiResponse,
      Error,
      TransitionPaperStatusDto
    >,
    'mutationFn'
  >;
};

export const useTransitionPaperStatus = ({
  paperId,
  mutationConfig,
}: UseTransitionPaperStatusOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: TransitionPaperStatusDto) =>
      transitionPaperStatus({ paperId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_STATUS_HISTORY, paperId],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
