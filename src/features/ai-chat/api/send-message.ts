import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { AI_CHAT_API, AI_CHAT_QUERY_KEYS } from '../constants';
import type { SendMessageRequest, SendMessageResponse } from '../types';

export const sendMessage = (
  request: SendMessageRequest,
): Promise<SendMessageResponse> => {
  return api.post(AI_CHAT_API.SEND_MESSAGE, {
    message: request.message,
    projectId: request.projectId,
    sessionId: request.sessionId ?? null,
    paperIds: request.paperIds ?? [],
    mode: request.mode ?? 'chat',
    sectionId: request.sectionId,
    sectionTarget: request.sectionTarget,
    writing: request.writing,
  });
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
      const [data, variables] = args;
      // Invalidate session messages for the active or newly created session
      queryClient.invalidateQueries({
        queryKey: [AI_CHAT_QUERY_KEYS.SESSION_MESSAGES, data.sessionId],
      });
      // Invalidate sessions list to update order & pick up new session
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: [
            AI_CHAT_QUERY_KEYS.SESSIONS,
            { projectId: variables.projectId },
          ],
          exact: false,
        });
      }
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
