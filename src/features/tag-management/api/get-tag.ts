import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { TAG_MANAGEMENT_API, TAG_MANAGEMENT_QUERY_KEYS } from '../constants';
import { GetTagByIdResultApiResponse } from '../types';

export const getTag = ({
  tagId,
}: {
  tagId: string;
}): Promise<GetTagByIdResultApiResponse> => {
  return api.get(TAG_MANAGEMENT_API.TAG_BY_ID(tagId));
};

export const getTagQueryOptions = (tagId: string) => {
  return queryOptions({
    queryKey: [TAG_MANAGEMENT_QUERY_KEYS.TAG, tagId],
    queryFn: () => getTag({ tagId }),
  });
};

type UseTagOptions = {
  tagId: string;
  queryConfig?: QueryConfig<typeof getTagQueryOptions>;
};

export const useTagDetail = ({ tagId, queryConfig }: UseTagOptions) => {
  return useQuery({
    ...getTagQueryOptions(tagId),
    ...queryConfig,
  });
};
