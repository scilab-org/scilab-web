import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  DOMAIN_MANAGEMENT_API,
  DOMAIN_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteDomain = (
  domainId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(DOMAIN_MANAGEMENT_API.ADMIN_DOMAIN_BY_ID(domainId));
};

type UseDeleteDomainOptions = {
  mutationConfig?: MutationConfig<typeof deleteDomain>;
};

export const useDeleteDomain = ({
  mutationConfig,
}: UseDeleteDomainOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteDomain,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DOMAIN_MANAGEMENT_QUERY_KEYS.DOMAINS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
