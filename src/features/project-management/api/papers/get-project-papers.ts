import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { GetProjectPapersParams } from '../../types';

export const getProjectPapers = async (
  projectId: string,
  params?: GetProjectPapersParams,
) => {
  const searchParams = new URLSearchParams();
  if (params?.Title) searchParams.append('Title', params.Title);
  if (params?.Tag?.length)
    params.Tag.forEach((t) => searchParams.append('Tag', t));
  if (params?.PageNumber)
    searchParams.append('PageNumber', String(params.PageNumber));
  if (params?.PageSize)
    searchParams.append('PageSize', String(params.PageSize));
  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PROJECT_PAPERS(projectId)}${query ? `?${query}` : ''}`;
  return api.get(url);
};

type UseProjectPapersOptions = {
  projectId: string;
  params?: GetProjectPapersParams;
  queryConfig?: any;
};

export const useProjectPapers = ({
  projectId,
  params,
  queryConfig,
}: UseProjectPapersOptions) => {
  return useQuery({
    queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT_PAPERS, projectId, params],
    queryFn: () => getProjectPapers(projectId, params),
    placeholderData: keepPreviousData,
    ...queryConfig,
  });
};
