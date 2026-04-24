import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  GAP_TYPE_MANAGEMENT_API,
  GAP_TYPE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteGapType = (
  gapTypeId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(GAP_TYPE_MANAGEMENT_API.ADMIN_GAP_TYPE_BY_ID(gapTypeId));
};

type UseDeleteGapTypeOptions = {
  mutationConfig?: MutationConfig<typeof deleteGapType>;
};

export const useDeleteGapType = ({
  mutationConfig,
}: UseDeleteGapTypeOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteGapType,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [GAP_TYPE_MANAGEMENT_QUERY_KEYS.GAP_TYPES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
