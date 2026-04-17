import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import type { PaperVersionItem } from '../types';

export type GetPaperVersionsResponse = {
  result: {
    items: PaperVersionItem[];
  };
};

export const getPaperVersions = ({
  paperId,
}: {
  paperId: string;
}): Promise<GetPaperVersionsResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPER_VERSIONS(paperId));
};

export const getPaperVersionsQueryOptions = (paperId: string) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_VERSIONS, paperId],
    queryFn: () => getPaperVersions({ paperId }),
    enabled: !!paperId,
  });
};

type UseGetPaperVersionsOptions = {
  paperId: string;
  queryConfig?: QueryConfig<typeof getPaperVersionsQueryOptions>;
};

export const useGetPaperVersions = ({
  paperId,
  queryConfig,
}: UseGetPaperVersionsOptions) => {
  return useQuery({
    ...getPaperVersionsQueryOptions(paperId),
    ...queryConfig,
  });
};
