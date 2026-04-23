import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  DOMAIN_MANAGEMENT_API,
  DOMAIN_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateDomainDto, StringApiCreatedResponse } from '../types';

export const createDomain = (
  data: CreateDomainDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(DOMAIN_MANAGEMENT_API.ADMIN_DOMAINS, data);
};

type UseCreateDomainOptions = {
  mutationConfig?: MutationConfig<typeof createDomain>;
};

export const useCreateDomain = ({
  mutationConfig,
}: UseCreateDomainOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createDomain,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DOMAIN_MANAGEMENT_QUERY_KEYS.DOMAINS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
