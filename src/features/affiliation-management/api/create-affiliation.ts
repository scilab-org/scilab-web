import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  AFFILIATION_MANAGEMENT_API,
  AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateAffiliationDto, StringApiCreatedResponse } from '../types';

export const createAffiliation = (
  data: CreateAffiliationDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(AFFILIATION_MANAGEMENT_API.ADMIN_AFFILIATIONS, data);
};

type UseCreateAffiliationOptions = {
  mutationConfig?: MutationConfig<typeof createAffiliation>;
};

export const useCreateAffiliation = ({
  mutationConfig,
}: UseCreateAffiliationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createAffiliation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [AFFILIATION_MANAGEMENT_QUERY_KEYS.AFFILIATIONS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
