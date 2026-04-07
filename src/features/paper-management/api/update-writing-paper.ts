import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { UpdateWritingPaperDto } from '../types';

export type UpdateWritingPaperPayload = {
  paperId: string;
  data: UpdateWritingPaperDto;
};

export const updateWritingPaper = ({
  paperId,
  data,
}: UpdateWritingPaperPayload): Promise<unknown> => {
  return api.put(PAPER_MANAGEMENT_API.WRITING_PAPER_BY_ID(paperId), data);
};

type UseUpdateWritingPaperOptions = {
  mutationConfig?: MutationConfig<typeof updateWritingPaper>;
};

export const useUpdateWritingPaper = ({
  mutationConfig,
}: UseUpdateWritingPaperOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateWritingPaper,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.WRITING_PAPER],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
