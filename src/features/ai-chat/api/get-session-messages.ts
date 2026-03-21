import { queryOptions, useQuery } from '@tanstack/react-query';

import { QueryConfig } from '@/lib/react-query';

import { AI_CHAT_QUERY_KEYS } from '../constants';
import { mockGetSessionMessages } from '../mock-data';
import type {
  GetSessionMessagesParams,
  GetSessionMessagesResponse,
} from '../types';

export const getSessionMessages = (
  sessionId: string,
  params: GetSessionMessagesParams = {},
): Promise<GetSessionMessagesResponse> => {
  // TODO: replace with real API call
  // return api.get(AI_CHAT_API.SESSION_MESSAGES(sessionId), { params });
  return mockGetSessionMessages(sessionId, params);
};

export const getSessionMessagesQueryOptions = (
  sessionId: string,
  params: GetSessionMessagesParams = {},
) => {
  return queryOptions({
    queryKey: [AI_CHAT_QUERY_KEYS.SESSION_MESSAGES, sessionId, params],
    queryFn: () => getSessionMessages(sessionId, params),
    enabled: !!sessionId,
  });
};

type UseSessionMessagesOptions = {
  sessionId: string;
  params?: GetSessionMessagesParams;
  queryConfig?: QueryConfig<typeof getSessionMessagesQueryOptions>;
};

export const useSessionMessages = ({
  sessionId,
  params = {},
  queryConfig,
}: UseSessionMessagesOptions) => {
  return useQuery({
    ...getSessionMessagesQueryOptions(sessionId, params),
    ...queryConfig,
  });
};
