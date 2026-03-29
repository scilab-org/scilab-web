import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { AI_CHAT_API, AI_CHAT_QUERY_KEYS } from '../constants';
import type { RenameSessionRequest, RenameSessionResponse } from '../types';

export const renameSession = ({
  sessionId,
  title,
}: {
  sessionId: string;
} & RenameSessionRequest): Promise<RenameSessionResponse> => {
  return api.patch(AI_CHAT_API.RENAME_SESSION(sessionId), { title });
};

type UseRenameSessionOptions = {
  projectId: string;
  mutationConfig?: MutationConfig<typeof renameSession>;
};

export const useRenameSession = ({
  projectId,
  mutationConfig,
}: UseRenameSessionOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: renameSession,
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
