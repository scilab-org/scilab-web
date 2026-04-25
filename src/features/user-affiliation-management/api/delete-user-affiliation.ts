import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  USER_AFFILIATION_MANAGEMENT_API,
  USER_AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteUserAffiliation = (
  userAffiliationId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(
    USER_AFFILIATION_MANAGEMENT_API.USER_AFFILIATION_BY_ID(userAffiliationId),
  );
};

type UseDeleteUserAffiliationOptions = {
  mutationConfig?: MutationConfig<typeof deleteUserAffiliation>;
};

export const useDeleteUserAffiliation = ({
  mutationConfig,
}: UseDeleteUserAffiliationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteUserAffiliation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_AFFILIATION_MANAGEMENT_QUERY_KEYS.USER_AFFILIATIONS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
