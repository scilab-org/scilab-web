import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { AddManagersRequest } from '../../types';

// Admin: POST /admin/projects/{projectId}/managers with { userId: "..." }
export const addManagers = async (
  projectId: string,
  data: AddManagersRequest,
) => {
  return api.post(PROJECT_MANAGEMENT_API.ADD_MANAGERS(projectId), data);
};

type UseAddManagersOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useAddManagers = ({
  projectId,
  mutationConfig,
}: UseAddManagersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: AddManagersRequest) => addManagers(projectId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT_MEMBERS, projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_USERS, projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.MY_ROLE, projectId],
      });
      onSuccess?.(...(args as Parameters<typeof onSuccess>));
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
