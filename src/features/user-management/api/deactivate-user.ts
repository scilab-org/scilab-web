import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deactivateUser = ({
  userId,
}: {
  userId: string;
}): Promise<BooleanApiDeletedResponse> => {
  return api.delete(USER_MANAGEMENT_API.DEACTIVATE_USER(userId));
};

type UseDeactivateUserOptions = {
  mutationConfig?: MutationConfig<typeof deactivateUser>;
};

export const useDeactivateUser = ({
  mutationConfig,
}: UseDeactivateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
