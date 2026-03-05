import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

type GetPaperMembersAvailableParams = {
  searchEmail?: string;
  projectRole?: string;
  pageNumber?: number;
  pageSize?: number;
};

export const getPaperMembersAvailable = async (
  subProjectId: string,
  params?: GetPaperMembersAvailableParams,
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
  const url = `${PROJECT_MANAGEMENT_API.PAPER_MEMBERS_AVAILABLE(subProjectId)}${query ? `?${query}` : ''}`;

  return api.get(url);
};

type UsePaperMembersAvailableOptions = {
  subProjectId: string;
  params?: GetPaperMembersAvailableParams;
  queryConfig?: any;
};

export const usePaperMembersAvailable = ({
  subProjectId,
  params,
  queryConfig,
}: UsePaperMembersAvailableOptions) => {
  return useQuery({
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.PAPER_MEMBERS_AVAILABLE,
      subProjectId,
      params,
    ],
    queryFn: () => getPaperMembersAvailable(subProjectId, params),
    ...queryConfig,
  });
};
