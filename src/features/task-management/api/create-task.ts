import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { TASK_MANAGEMENT_API, TASK_MANAGEMENT_QUERY_KEYS } from '../constants';
import { CreateTaskDto, StringApiResponse } from '../types';

export const createTask = (data: CreateTaskDto): Promise<StringApiResponse> => {
  return api.post(TASK_MANAGEMENT_API.TASKS, data);
};

type UseCreateTaskOptions = {
  mutationConfig?: MutationConfig<typeof createTask>;
};

export const useCreateTask = ({ mutationConfig }: UseCreateTaskOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createTask,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_TASKS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
