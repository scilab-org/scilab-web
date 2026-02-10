import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { PROJECT_MANAGEMENT_QUERY_KEYS } from '../constants';
import { ApiResponse, Project } from '../types';

export const getProject = async (projectId: string): Promise<Project> => {
  const response: ApiResponse<{ project: Project }> = await api.get(
    `/projects/${projectId}`,
  );
  return response.result.project;
};

export const getProjectQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT, projectId],
    queryFn: () => getProject(projectId),
  });
};

type UseProjectOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getProjectQueryOptions>;
};

export const useProject = ({ projectId, queryConfig }: UseProjectOptions) => {
  return useQuery({
    ...getProjectQueryOptions(projectId),
    ...queryConfig,
  });
};
