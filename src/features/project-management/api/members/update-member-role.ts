import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

// PUT /manager/projects/{projectId}/members/{memberId}/role
// Body: raw JSON string e.g. "project:author"
export const updateMemberRole = async (
  projectId: string,
  memberId: string,
  groupName: string,
) => {
  return api.put(
    PROJECT_MANAGEMENT_API.UPDATE_MEMBER_ROLE(projectId, memberId),
    JSON.stringify(groupName),
    { headers: { 'Content-Type': 'application/json' } },
  );
};

type UseUpdateMemberRoleOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useUpdateMemberRole = ({
  projectId,
  mutationConfig,
}: UseUpdateMemberRoleOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: ({
      memberId,
      groupName,
    }: {
      memberId: string;
      groupName: string;
    }) => updateMemberRole(projectId, memberId, groupName),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT_MEMBERS, projectId],
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
