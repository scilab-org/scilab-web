import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { RemoveMembersRequest } from '../../types';

// Admin: POST /admin/projects/{projectId}/managers/remove
// Requires system:admin group in JWT
export const removeProjectManagers = async (
  projectId: string,
  data: RemoveMembersRequest,
) => {
  return api.post(PROJECT_MANAGEMENT_API.REMOVE_MANAGERS(projectId), data);
};

type UseRemoveProjectManagersOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useRemoveProjectManagers = ({
  projectId,
  mutationConfig,
}: UseRemoveProjectManagersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: RemoveMembersRequest) =>
      removeProjectManagers(projectId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT_MEMBERS, projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_USERS, projectId],
      });
      onSuccess?.(...(args as Parameters<typeof onSuccess>));
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
