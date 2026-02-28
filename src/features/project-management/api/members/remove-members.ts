import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { RemoveMembersRequest } from '../../types';

export const removeMembers = async (
  projectId: string,
  data: RemoveMembersRequest,
) => {
  return api.post(
    PROJECT_MANAGEMENT_API.REMOVE_PROJECT_MEMBERS(projectId),
    data,
  );
};

type UseRemoveMembersOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useRemoveMembers = ({
  projectId,
  mutationConfig,
}: UseRemoveMembersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: RemoveMembersRequest) => removeMembers(projectId, data),
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
