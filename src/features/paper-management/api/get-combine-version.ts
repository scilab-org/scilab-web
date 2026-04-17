import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import type { PaperVersionItem } from '../types';

export type GetCombineVersionResponse = {
  result: {
    version: PaperVersionItem;
  };
};

export const getCombineVersion = ({
  paperId,
  versionId,
}: {
  paperId: string;
  versionId: string;
}): Promise<GetCombineVersionResponse> => {
  return api.get(PAPER_MANAGEMENT_API.COMBINE_VERSION(paperId, versionId));
};

export const getCombineVersionQueryOptions = (
  paperId: string,
  versionId: string,
) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.COMBINE_VERSION, paperId, versionId],
    queryFn: () => getCombineVersion({ paperId, versionId }),
    enabled: !!paperId && !!versionId,
  });
};

type UseGetCombineVersionOptions = {
  paperId: string;
  versionId: string;
  queryConfig?: QueryConfig<typeof getCombineVersionQueryOptions>;
};

export const useGetCombineVersion = ({
  paperId,
  versionId,
  queryConfig,
}: UseGetCombineVersionOptions) => {
  return useQuery({
    ...getCombineVersionQueryOptions(paperId, versionId),
    ...queryConfig,
  });
};
