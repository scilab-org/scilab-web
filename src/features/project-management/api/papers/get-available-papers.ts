import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

export const getAvailablePapers = async (
  projectId: string,
  searchText?: string,
) => {
  const searchParams = new URLSearchParams();
  if (searchText) searchParams.append('searchText', searchText);
  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PROJECT_PAPERS_AVAILABLE(projectId)}${query ? `?${query}` : ''}`;
  return api.get(url);
};

type UseAvailablePapersOptions = {
  projectId: string;
  searchText?: string;
  queryConfig?: any;
};

export const useAvailablePapers = ({
  projectId,
  searchText,
  queryConfig,
}: UseAvailablePapersOptions) => {
  return useQuery({
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_PAPERS,
      projectId,
      searchText,
    ],
    queryFn: () => getAvailablePapers(projectId, searchText),
    ...queryConfig,
  });
};
