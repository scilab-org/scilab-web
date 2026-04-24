import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  AUTHOR_ROLE_MANAGEMENT_API,
  AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteAuthorRole = (
  authorRoleId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(
    AUTHOR_ROLE_MANAGEMENT_API.ADMIN_AUTHOR_ROLE_BY_ID(authorRoleId),
  );
};

type UseDeleteAuthorRoleOptions = {
  mutationConfig?: MutationConfig<typeof deleteAuthorRole>;
};

export const useDeleteAuthorRole = ({
  mutationConfig,
}: UseDeleteAuthorRoleOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteAuthorRole,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS.AUTHOR_ROLES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
