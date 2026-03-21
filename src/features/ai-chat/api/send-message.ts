import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MutationConfig } from '@/lib/react-query';

import { AI_CHAT_QUERY_KEYS } from '../constants';
import { mockSendMessage } from '../mock-data';
import type { SendMessageRequest, SendMessageResponse } from '../types';

export const sendMessage = (
  request: SendMessageRequest,
): Promise<SendMessageResponse> => {
  // TODO: replace with real API call
  // return api.post(AI_CHAT_API.SEND_MESSAGE, request);
  return mockSendMessage(request);
};

type UseSendMessageOptions = {
  mutationConfig?: MutationConfig<typeof sendMessage>;
};

export const useSendMessage = ({
  mutationConfig,
}: UseSendMessageOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (...args) => {
      const [, variables] = args;
      // Invalidate session messages for the active session
      if (variables.sessionId) {
        queryClient.invalidateQueries({
          queryKey: [AI_CHAT_QUERY_KEYS.SESSION_MESSAGES, variables.sessionId],
        });
      }
      // Invalidate sessions list to update order & counts
      queryClient.invalidateQueries({
        queryKey: [AI_CHAT_QUERY_KEYS.SESSIONS, variables.projectId],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
