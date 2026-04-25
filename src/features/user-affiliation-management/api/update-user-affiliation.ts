import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  USER_AFFILIATION_MANAGEMENT_API,
  USER_AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateUserAffiliationDto } from '../types';

export const updateUserAffiliation = ({
  userAffiliationId,
  data,
}: {
  userAffiliationId: string;
  data: UpdateUserAffiliationDto;
}): Promise<BooleanApiUpdatedResponse> => {
  return api.put(
    USER_AFFILIATION_MANAGEMENT_API.USER_AFFILIATION_BY_ID(userAffiliationId),
    data,
  );
};

type UseUpdateUserAffiliationOptions = {
  mutationConfig?: MutationConfig<typeof updateUserAffiliation>;
};

export const useUpdateUserAffiliation = ({
  mutationConfig,
}: UseUpdateUserAffiliationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateUserAffiliation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_AFFILIATION_MANAGEMENT_QUERY_KEYS.USER_AFFILIATIONS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
