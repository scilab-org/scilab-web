import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  USER_AFFILIATION_MANAGEMENT_API,
  USER_AFFILIATION_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateUserAffiliationDto, StringApiCreatedResponse } from '../types';

export const createUserAffiliation = (
  data: CreateUserAffiliationDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(USER_AFFILIATION_MANAGEMENT_API.USER_AFFILIATIONS, data);
};

type UseCreateUserAffiliationOptions = {
  mutationConfig?: MutationConfig<typeof createUserAffiliation>;
};

export const useCreateUserAffiliation = ({
  mutationConfig,
}: UseCreateUserAffiliationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createUserAffiliation,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_AFFILIATION_MANAGEMENT_QUERY_KEYS.USER_AFFILIATIONS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
