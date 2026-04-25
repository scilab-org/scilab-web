import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  AFFILIATION_MANAGEMENT_API,
  AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteAffiliation = (
  affiliationId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(
    AFFILIATION_MANAGEMENT_API.ADMIN_AFFILIATION_BY_ID(affiliationId),
  );
};

type UseDeleteAffiliationOptions = {
  mutationConfig?: MutationConfig<typeof deleteAffiliation>;
};

export const useDeleteAffiliation = ({
  mutationConfig,
}: UseDeleteAffiliationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteAffiliation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AFFILIATION_MANAGEMENT_QUERY_KEYS.AFFILIATIONS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
