import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { GetProjectMembersParams } from '../../types';

export const getProjectMembers = async (
  projectId: string,
  params?: GetProjectMembersParams,
) => {
  const searchParams = new URLSearchParams();

  if (params?.searchEmail) {
    searchParams.append('searchEmail', params.searchEmail);
  }
  if (params?.pageNumber) {
    searchParams.append('pageNumber', params.pageNumber.toString());
  }
  if (params?.pageSize) {
    searchParams.append('pageSize', params.pageSize.toString());
  }

  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PROJECT_MEMBERS(projectId)}${query ? `?${query}` : ''}`;

  return api.get(url);
};

export const getProjectMembersQueryOptions = (
  projectId: string,
  params?: GetProjectMembersParams,
) => {
  return {
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT_MEMBERS,
      projectId,
      params,
    ],
    queryFn: () => getProjectMembers(projectId, params),
  };
};

type UseProjectMembersOptions = {
  projectId: string;
  params?: GetProjectMembersParams;
  queryConfig?: any;
};

export const useProjectMembers = ({
  projectId,
  params,
  queryConfig,
}: UseProjectMembersOptions) => {
  return useQuery({
    ...getProjectMembersQueryOptions(projectId, params),
    ...queryConfig,
  });
};
