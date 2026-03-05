import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

type GetPaperMembersParams = {
  searchEmail?: string;
  projectRole?: string;
  pageNumber?: number;
  pageSize?: number;
};

export const getPaperMembers = async (
  subProjectId: string,
  params?: GetPaperMembersParams,
) => {
  const searchParams = new URLSearchParams();
  if (params?.searchEmail)
    searchParams.append('SearchEmail', params.searchEmail);
  if (params?.projectRole)
    searchParams.append('ProjectRole', params.projectRole);
  if (params?.pageNumber != null)
    searchParams.append('PageNumber', String(params.pageNumber));
  if (params?.pageSize != null)
    searchParams.append('PageSize', String(params.pageSize));

  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PAPER_MEMBERS(subProjectId)}${query ? `?${query}` : ''}`;

  return api.get(url);
};

type UsePaperMembersOptions = {
  subProjectId: string;
  params?: GetPaperMembersParams;
  queryConfig?: any;
};

export const usePaperMembers = ({
  subProjectId,
  params,
  queryConfig,
}: UsePaperMembersOptions) => {
  return useQuery({
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.PAPER_MEMBERS,
      subProjectId,
      params,
    ],
    queryFn: () => getPaperMembers(subProjectId, params),
    ...queryConfig,
  });
};
