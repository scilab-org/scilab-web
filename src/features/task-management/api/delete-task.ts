import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { TASK_MANAGEMENT_API, TASK_MANAGEMENT_QUERY_KEYS } from '../constants';
import { StringApiResponse } from '../types';

export const deleteTask = (id: string): Promise<StringApiResponse> => {
  return api.delete(TASK_MANAGEMENT_API.TASK_BY_ID(id));
};

type UseDeleteTaskOptions = {
  mutationConfig?: MutationConfig<typeof deleteTask>;
};

export const useDeleteTask = ({
  mutationConfig,
}: UseDeleteTaskOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_TASKS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
