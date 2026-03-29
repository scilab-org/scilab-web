import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { AI_CHAT_API, AI_CHAT_QUERY_KEYS } from '../constants';
import type {
  GetSessionMessagesParams,
  GetSessionMessagesResponse,
} from '../types';

export const getSessionMessages = (
  sessionId: string,
  params: GetSessionMessagesParams = {},
): Promise<GetSessionMessagesResponse> => {
  return api.get(AI_CHAT_API.SESSION_MESSAGES(sessionId), { params });
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
