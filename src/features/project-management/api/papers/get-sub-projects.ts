import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { GetSubProjectsParams } from '../../types';

export const getSubProjects = async (
  projectId: string,
  params?: GetSubProjectsParams,
) => {
  const searchParams = new URLSearchParams();
  if (params?.PageNumber != null)
    searchParams.append('PageNumber', String(params.PageNumber));
  if (params?.PageSize != null)
    searchParams.append('PageSize', String(params.PageSize));
  if (params?.title) searchParams.append('title', params.title);
  if (params?.subProjectId)
    searchParams.append('subProjectId', params.subProjectId);
  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.SUB_PROJECTS(projectId)}${query ? `?${query}` : ''}`;
  return api.get(url);
};

type UseSubProjectsOptions = {
  projectId: string;
  params?: GetSubProjectsParams;
  queryConfig?: any;
};

export const useSubProjects = ({
  projectId,
  params,
  queryConfig,
}: UseSubProjectsOptions) => {
  return useQuery({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.SUB_PROJECTS, projectId, params],
    queryFn: () => getSubProjects(projectId, params),
    placeholderData: keepPreviousData,
    ...queryConfig,
  });
};
