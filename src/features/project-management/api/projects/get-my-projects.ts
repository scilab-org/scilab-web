import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { ProjectsResponse, GetProjectsParams } from '../../types';

type GetMyProjectsParams = Pick<
  GetProjectsParams,
  'Name' | 'Code' | 'Status' | 'PageNumber' | 'PageSize'
>;

export const getMyProjects = (
  params: GetMyProjectsParams = {},
): Promise<ProjectsResponse> => {
  return api.get(PROJECT_MANAGEMENT_API.MY_PROJECTS, { params });
};

export const getMyProjectsQueryOptions = (params: GetMyProjectsParams = {}) => {
  return queryOptions({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.MY_PROJECTS, params],
    queryFn: () => getMyProjects(params),
  });
};

type UseMyProjectsOptions = {
  params?: GetMyProjectsParams;
  queryConfig?: QueryConfig<typeof getMyProjectsQueryOptions>;
};

export const useMyProjects = ({
  params = {},
  queryConfig,
}: UseMyProjectsOptions = {}) => {
  return useQuery({
    ...getMyProjectsQueryOptions(params),
    ...queryConfig,
  });
};
