import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { AI_CHAT_API, AI_CHAT_QUERY_KEYS } from '../constants';
import type { GetSessionsParams, GetSessionsResponse } from '../types';

export const getSessions = (
  params: GetSessionsParams,
): Promise<GetSessionsResponse> => {
  return api.get(AI_CHAT_API.SESSIONS, { params });
};

export const getSessionsQueryOptions = (params: GetSessionsParams) => {
  return queryOptions({
    queryKey: [AI_CHAT_QUERY_KEYS.SESSIONS, params],
    queryFn: () => getSessions(params),
    enabled: !!params.projectId,
  });
};

type UseSessionsOptions = {
  params: GetSessionsParams;
  queryConfig?: QueryConfig<typeof getSessionsQueryOptions>;
};

export const useSessions = ({ params, queryConfig }: UseSessionsOptions) => {
  return useQuery({
    ...getSessionsQueryOptions(params),
    ...queryConfig,
  });
};
