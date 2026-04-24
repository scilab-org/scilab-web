import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  DOMAIN_MANAGEMENT_API,
  DOMAIN_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateDomainDto } from '../types';

export const updateDomain = ({
  domainId,
  data,
}: {
  domainId: string;
  data: UpdateDomainDto;
}): Promise<BooleanApiUpdatedResponse> => {
  return api.put(DOMAIN_MANAGEMENT_API.ADMIN_DOMAIN_BY_ID(domainId), data);
};

type UseUpdateDomainOptions = {
  mutationConfig?: MutationConfig<typeof updateDomain>;
};

export const useUpdateDomain = ({
  mutationConfig,
}: UseUpdateDomainOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateDomain,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DOMAIN_MANAGEMENT_QUERY_KEYS.DOMAINS],
      });
      queryClient.invalidateQueries({
        queryKey: [DOMAIN_MANAGEMENT_QUERY_KEYS.DOMAIN],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
