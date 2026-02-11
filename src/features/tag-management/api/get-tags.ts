import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { TAG_MANAGEMENT_API, TAG_MANAGEMENT_QUERY_KEYS } from '../constants';
import { GetTagsResultApiResponse, GetTagsParams } from '../types';

export const getTags = (
  params: GetTagsParams = {},
): Promise<GetTagsResultApiResponse> => {
  return api.get(TAG_MANAGEMENT_API.TAGS, { params });
};

export const getTagsQueryOptions = (params: GetTagsParams = {}) => {
  return queryOptions({
    queryKey: [TAG_MANAGEMENT_QUERY_KEYS.TAGS, params],
    queryFn: () => getTags(params),
  });
};

type UseTagsOptions = {
  params?: GetTagsParams;
  queryConfig?: QueryConfig<typeof getTagsQueryOptions>;
};

export const useTags = ({ params = {}, queryConfig }: UseTagsOptions = {}) => {
  return useQuery({
    ...getTagsQueryOptions(params),
    ...queryConfig,
  });
};
