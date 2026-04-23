import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetAvailablePaperAuthorsApiResponse } from '../types';

type GetAvailablePaperAuthorsParams = {
  paperId: string;
  PageNumber?: number;
  PageSize?: number;
};

export const getAvailablePaperAuthors = ({
  subProjectId,
  params,
}: {
  subProjectId: string;
  params: GetAvailablePaperAuthorsParams;
}): Promise<GetAvailablePaperAuthorsApiResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.append('paperId', params.paperId);
  if (params.PageNumber != null)
    searchParams.append('PageNumber', String(params.PageNumber));
  if (params.PageSize != null)
    searchParams.append('PageSize', String(params.PageSize));

  return api.get(
    `${PAPER_MANAGEMENT_API.AVAILABLE_PAPER_AUTHORS(subProjectId)}?${searchParams.toString()}`,
  );
};

export const getAvailablePaperAuthorsQueryOptions = (
  subProjectId: string,
  params: GetAvailablePaperAuthorsParams,
) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.AVAILABLE_PAPER_AUTHORS, subProjectId, params],
    queryFn: () => getAvailablePaperAuthors({ subProjectId, params }),
  });
};

type UseAvailablePaperAuthorsOptions = {
  subProjectId: string;
  params: GetAvailablePaperAuthorsParams;
  queryConfig?: QueryConfig<typeof getAvailablePaperAuthorsQueryOptions>;
};

export const useAvailablePaperAuthors = ({
  subProjectId,
  params,
  queryConfig,
}: UseAvailablePaperAuthorsOptions) => {
  return useQuery({
    ...getAvailablePaperAuthorsQueryOptions(subProjectId, params),
    ...queryConfig,
  });
};
