import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { BooleanApiUpdatedResponse } from '../types';

export const activateUser = ({
  userId,
}: {
  userId: string;
}): Promise<BooleanApiUpdatedResponse> => {
  return api.put(USER_MANAGEMENT_API.ACTIVATE_USER(userId));
};

type UseActivateUserOptions = {
  mutationConfig?: MutationConfig<typeof activateUser>;
};

export const useActivateUser = ({
  mutationConfig,
}: UseActivateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: activateUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USER],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
