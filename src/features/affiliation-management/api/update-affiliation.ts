import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  AFFILIATION_MANAGEMENT_API,
  AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateAffiliationDto } from '../types';

export const updateAffiliation = ({
  affiliationId,
  data,
}: {
  affiliationId: string;
  data: UpdateAffiliationDto;
}): Promise<BooleanApiUpdatedResponse> => {
  return api.put(
    AFFILIATION_MANAGEMENT_API.ADMIN_AFFILIATION_BY_ID(affiliationId),
    data,
  );
};

type UseUpdateAffiliationOptions = {
  mutationConfig?: MutationConfig<typeof updateAffiliation>;
};

export const useUpdateAffiliation = ({
  mutationConfig,
}: UseUpdateAffiliationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateAffiliation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AFFILIATION_MANAGEMENT_QUERY_KEYS.AFFILIATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [AFFILIATION_MANAGEMENT_QUERY_KEYS.AFFILIATION],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
