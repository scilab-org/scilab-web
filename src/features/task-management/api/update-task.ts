import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { TASK_MANAGEMENT_API, TASK_MANAGEMENT_QUERY_KEYS } from '../constants';
import { StringApiResponse, UpdateTaskDto } from '../types';

export const updateTask = ({
  id,
  data,
}: {
  id: string;
  data: UpdateTaskDto;
}): Promise<StringApiResponse> => {
  return api.put(TASK_MANAGEMENT_API.TASK_BY_ID(id), data);
};

type UseUpdateTaskOptions = {
  mutationConfig?: MutationConfig<typeof updateTask>;
};

export const useUpdateTask = ({ mutationConfig }: UseUpdateTaskOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_TASKS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
