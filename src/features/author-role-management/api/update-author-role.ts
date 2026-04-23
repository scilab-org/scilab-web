import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  AUTHOR_ROLE_MANAGEMENT_API,
  AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateAuthorRoleDto } from '../types';

export const updateAuthorRole = ({
  authorRoleId,
  data,
}: {
  authorRoleId: string;
  data: UpdateAuthorRoleDto;
}): Promise<BooleanApiUpdatedResponse> => {
  return api.put(
    AUTHOR_ROLE_MANAGEMENT_API.ADMIN_AUTHOR_ROLE_BY_ID(authorRoleId),
    data,
  );
};

type UseUpdateAuthorRoleOptions = {
  mutationConfig?: MutationConfig<typeof updateAuthorRole>;
};

export const useUpdateAuthorRole = ({
  mutationConfig,
}: UseUpdateAuthorRoleOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateAuthorRole,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS.AUTHOR_ROLES],
      });
      queryClient.invalidateQueries({
        queryKey: [AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS.AUTHOR_ROLE],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
