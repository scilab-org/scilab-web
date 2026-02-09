import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { CreateUserDto, StringApiCreatedResponse } from '../types';

export const createUser = (
  data: CreateUserDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(USER_MANAGEMENT_API.USERS, data);
};

type UseCreateUserOptions = {
  mutationConfig?: MutationConfig<typeof createUser>;
};

export const useCreateUser = ({
  mutationConfig,
}: UseCreateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
