import { queryOptions, useQuery } from '@tanstack/react-query';

import { QueryConfig } from '@/lib/react-query';

import { AI_CHAT_QUERY_KEYS } from '../constants';
import { mockGetSessions } from '../mock-data';
import type { GetSessionsResponse } from '../types';

export const getSessions = (
  projectId: string,
): Promise<GetSessionsResponse> => {
  // TODO: replace with real API call
  // return api.get(AI_CHAT_API.SESSIONS, { params: { projectId } });
  return mockGetSessions(projectId);
};

export const getSessionsQueryOptions = (projectId: string) => {
  return queryOptions({
    queryKey: [AI_CHAT_QUERY_KEYS.SESSIONS, projectId],
    queryFn: () => getSessions(projectId),
  });
};

type UseSessionsOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getSessionsQueryOptions>;
};

export const useSessions = ({ projectId, queryConfig }: UseSessionsOptions) => {
  return useQuery({
    ...getSessionsQueryOptions(projectId),
    ...queryConfig,
  });
};
