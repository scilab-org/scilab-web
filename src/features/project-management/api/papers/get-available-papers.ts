import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

type GetAvailablePapersParams = {
  searchText?: string;
  Tag?: string[];
};

export const getAvailablePapers = async (
  projectId: string,
  params?: GetAvailablePapersParams,
) => {
  const searchParams = new URLSearchParams();
  if (params?.searchText) searchParams.append('searchText', params.searchText);
  if (params?.Tag?.length)
    params.Tag.forEach((t) => searchParams.append('Tag', t));
  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PROJECT_PAPERS_AVAILABLE(projectId)}${query ? `?${query}` : ''}`;
  return api.get(url);
};

type UseAvailablePapersOptions = {
  projectId: string;
  params?: GetAvailablePapersParams;
  queryConfig?: any;
};

export const useAvailablePapers = ({
  projectId,
  params,
  queryConfig,
}: UseAvailablePapersOptions) => {
  return useQuery({
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_PAPERS,
      projectId,
      params,
    ],
    queryFn: () => getAvailablePapers(projectId, params),
    ...queryConfig,
  });
};
