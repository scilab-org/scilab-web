import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { TASK_MANAGEMENT_API, TASK_MANAGEMENT_QUERY_KEYS } from '../constants';
import { GetMyTasksParams, TasksResponse } from '../types';

export const getMyTasks = (
  params: GetMyTasksParams = {},
): Promise<TasksResponse> => {
  return api.get(TASK_MANAGEMENT_API.MY_TASKS, { params });
};

export const getMyTasksQueryOptions = (params: GetMyTasksParams = {}) => {
  return queryOptions({
    queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_TASKS, params],
    queryFn: () => getMyTasks(params),
  });
};

type UseMyTasksOptions = {
  params?: GetMyTasksParams;
  queryConfig?: QueryConfig<typeof getMyTasksQueryOptions>;
};

export const useMyTasks = ({ params = {}, queryConfig }: UseMyTasksOptions = {}) =>
  useQuery({
    ...getMyTasksQueryOptions(params),
    ...queryConfig,
  });
