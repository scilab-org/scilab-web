import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { TASK_MANAGEMENT_API, TASK_MANAGEMENT_QUERY_KEYS } from '../constants';
import { GetMyTasksParams, TasksResponse } from '../types';

export const getPaperTasks = (
  paperId: string,
  params: GetMyTasksParams = {},
): Promise<TasksResponse> => {
  return api.get(TASK_MANAGEMENT_API.PAPER_TASKS(paperId), { params });
};

export const getPaperTasksQueryOptions = (
  paperId: string,
  params: GetMyTasksParams = {},
) => {
  return queryOptions({
    queryKey: [TASK_MANAGEMENT_QUERY_KEYS.PAPER_TASKS, paperId, params],
    queryFn: () => getPaperTasks(paperId, params),
  });
};

type UsePaperTasksOptions = {
  paperId: string;
  params?: GetMyTasksParams;
  queryConfig?: QueryConfig<typeof getPaperTasksQueryOptions>;
};

export const usePaperTasks = ({
  paperId,
  params = {},
  queryConfig,
}: UsePaperTasksOptions) =>
  useQuery({
    ...getPaperTasksQueryOptions(paperId, params),
    ...queryConfig,
  });

