import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MutationConfig } from '@/lib/react-query';

import { AI_CHAT_QUERY_KEYS } from '../constants';
import { mockDeleteSession } from '../mock-data';
import type { DeleteSessionResponse } from '../types';

export const deleteSession = ({
  sessionId,
}: {
  sessionId: string;
}): Promise<DeleteSessionResponse> => {
  // TODO: replace with real API call
  // return api.delete(AI_CHAT_API.DELETE_SESSION(sessionId));
  return mockDeleteSession(sessionId);
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
        queryKey: [AI_CHAT_QUERY_KEYS.SESSIONS, projectId],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
