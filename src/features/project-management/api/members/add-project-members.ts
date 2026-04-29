import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { AddProjectMembersRequest } from '../../types';

// Manager: POST /manager/projects/{projectId}/members with { members: [{userId, groupName}] }
export const addProjectMembers = async (
  projectId: string,
  data: AddProjectMembersRequest,
) => {
  return api.post(PROJECT_MANAGEMENT_API.ADD_PROJECT_MEMBERS(projectId), data);
};

type UseAddProjectMembersOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useAddProjectMembers = ({
  projectId,
  mutationConfig,
}: UseAddProjectMembersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: AddProjectMembersRequest) =>
      addProjectMembers(projectId, data),
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
