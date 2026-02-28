import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { GetAvailableUsersParams } from '../../types';

export const getAvailableUsers = async (
  projectId: string,
  params?: GetAvailableUsersParams,
) => {
  const searchParams = new URLSearchParams();

  if (params?.searchText) {
    searchParams.append('searchText', params.searchText);
  }
  if (params?.adminGroupName) {
    searchParams.append('adminGroupName', params.adminGroupName);
  }

  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PROJECT_USERS_AVAILABLE(projectId)}${query ? `?${query}` : ''}`;

  return api.get(url);
};

export const getAvailableUsersQueryOptions = (
  projectId: string,
  params?: GetAvailableUsersParams,
) => {
  return {
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_USERS,
      projectId,
      params,
    ],
    queryFn: () => getAvailableUsers(projectId, params),
  };
};

type UseAvailableUsersOptions = {
  projectId: string;
  params?: GetAvailableUsersParams;
  queryConfig?: any;
};

export const useAvailableUsers = ({
  projectId,
  params,
  queryConfig,
}: UseAvailableUsersOptions) => {
  return useQuery({
    ...getAvailableUsersQueryOptions(projectId, params),
    ...queryConfig,
  });
};
