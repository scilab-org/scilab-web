import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { AI_CHAT_API, AI_CHAT_QUERY_KEYS } from '../constants';

export const deleteSession = ({
  sessionId,
}: {
  sessionId: string;
}): Promise<void> => {
  return api.delete(AI_CHAT_API.DELETE_SESSION(sessionId));
};

type UseDeleteSessionOptions = {
  projectId: string;
  mutationConfig?: MutationConfig<typeof deleteSession>;
};

export const useDeleteSession = ({
  projectId,
  mutationConfig,
}: UseDeleteSessionOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AI_CHAT_QUERY_KEYS.SESSIONS, { projectId }],
        exact: false,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
