import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { TASK_MANAGEMENT_API, TASK_MANAGEMENT_QUERY_KEYS } from '../constants';
import { AssignedPapersResponse, GetMyAssignedPapersParams } from '../types';

export const getMyAssignedPapers = (
  params: GetMyAssignedPapersParams = {},
): Promise<AssignedPapersResponse> => {
  return api.get(TASK_MANAGEMENT_API.MY_ASSIGNED_PAPERS, { params });
};

export const getMyAssignedPapersQueryOptions = (
  params: GetMyAssignedPapersParams = {},
) => {
  return queryOptions({
    queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_ASSIGNED_PAPERS, params],
    queryFn: () => getMyAssignedPapers(params),
  });
};

type UseMyAssignedPapersOptions = {
  params?: GetMyAssignedPapersParams;
  queryConfig?: QueryConfig<typeof getMyAssignedPapersQueryOptions>;
};

export const useMyAssignedPapers = ({
  params = {},
  queryConfig,
}: UseMyAssignedPapersOptions = {}) =>
  useQuery({
    ...getMyAssignedPapersQueryOptions(params),
    ...queryConfig,
  });
