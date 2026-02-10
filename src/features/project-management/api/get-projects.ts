import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { ProjectsResponse, GetProjectsParams } from '../types';

export const getProjects = (
  params: GetProjectsParams = {},
): Promise<ProjectsResponse> => {
  return api.get(PROJECT_MANAGEMENT_API.PROJECTS, {
    params: {
      SearchText: params.searchText || '',
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 10,
    },
  });
};

export const getProjectsQueryOptions = (params: GetProjectsParams = {}) => {
  return queryOptions({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECTS, params],
    queryFn: () => getProjects(params),
  });
};

type UseProjectsOptions = {
  params?: GetProjectsParams;
  queryConfig?: QueryConfig<typeof getProjectsQueryOptions>;
};

export const useProjects = ({
  params = {},
  queryConfig,
}: UseProjectsOptions = {}) => {
  return useQuery({
    ...getProjectsQueryOptions(params),
    ...queryConfig,
  });
};
