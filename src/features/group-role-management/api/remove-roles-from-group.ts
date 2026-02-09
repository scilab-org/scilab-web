import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { GROUP_ROLE_API, GROUP_ROLE_QUERY_KEYS } from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const removeRolesFromGroup = ({
  groupId,
  roleNames,
}: {
  groupId: string;
  roleNames: string[];
}): Promise<BooleanApiDeletedResponse> => {
  return api.delete(GROUP_ROLE_API.GROUP_ROLES(groupId), {
    data: roleNames,
  });
};

type UseRemoveRolesFromGroupOptions = {
  mutationConfig?: MutationConfig<typeof removeRolesFromGroup>;
};

export const useRemoveRolesFromGroup = ({
  mutationConfig,
}: UseRemoveRolesFromGroupOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: removeRolesFromGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [GROUP_ROLE_QUERY_KEYS.GROUP_ROLES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
