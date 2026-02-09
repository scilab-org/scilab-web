import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { GROUP_ROLE_API, GROUP_ROLE_QUERY_KEYS } from '../constants';
import { BooleanApiUpdatedResponse } from '../types';

export const addRolesToGroup = ({
  groupId,
  roleNames,
}: {
  groupId: string;
  roleNames: string[];
}): Promise<BooleanApiUpdatedResponse> => {
  return api.post(GROUP_ROLE_API.GROUP_ROLES(groupId), roleNames);
};

type UseAddRolesToGroupOptions = {
  mutationConfig?: MutationConfig<typeof addRolesToGroup>;
};

export const useAddRolesToGroup = ({
  mutationConfig,
}: UseAddRolesToGroupOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: addRolesToGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [GROUP_ROLE_QUERY_KEYS.GROUP_ROLES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
