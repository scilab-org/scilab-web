import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetProjectByIdResultApiResponse } from '../types';

export const getProject = ({
  projectId,
}: {
  projectId: string;
}): Promise<GetProjectByIdResultApiResponse> => {
  return api.get(PROJECT_MANAGEMENT_API.PROJECT_BY_ID(projectId));
};

export const getProjectQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT, projectId],
    queryFn: () => getProject({ projectId }),
  });
};

type UseProjectOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getProjectQueryOptions>;
};

export const useProjectDetail = ({
  projectId,
  queryConfig,
}: UseProjectOptions) => {
  return useQuery({
    ...getProjectQueryOptions(projectId),
    ...queryConfig,
  });
};
