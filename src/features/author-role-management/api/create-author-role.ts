import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  AUTHOR_ROLE_MANAGEMENT_API,
  AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateAuthorRoleDto, StringApiCreatedResponse } from '../types';

export const createAuthorRole = (
  data: CreateAuthorRoleDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(AUTHOR_ROLE_MANAGEMENT_API.ADMIN_AUTHOR_ROLES, data);
};

type UseCreateAuthorRoleOptions = {
  mutationConfig?: MutationConfig<typeof createAuthorRole>;
};

export const useCreateAuthorRole = ({
  mutationConfig,
}: UseCreateAuthorRoleOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createAuthorRole,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS.AUTHOR_ROLES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
