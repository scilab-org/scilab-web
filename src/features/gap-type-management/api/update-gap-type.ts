import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  GAP_TYPE_MANAGEMENT_API,
  GAP_TYPE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateGapTypeDto } from '../types';

export type UpdateGapTypePayload = {
  gapTypeId: string;
  data: UpdateGapTypeDto;
};

export const updateGapType = ({
  gapTypeId,
  data,
}: UpdateGapTypePayload): Promise<BooleanApiUpdatedResponse> => {
  return api.put(GAP_TYPE_MANAGEMENT_API.ADMIN_GAP_TYPE_BY_ID(gapTypeId), data);
};

type UseUpdateGapTypeOptions = {
  mutationConfig?: MutationConfig<typeof updateGapType>;
};

export const useUpdateGapType = ({
  mutationConfig,
}: UseUpdateGapTypeOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateGapType,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [GAP_TYPE_MANAGEMENT_QUERY_KEYS.GAP_TYPES],
      });
      queryClient.invalidateQueries({
        queryKey: [GAP_TYPE_MANAGEMENT_QUERY_KEYS.GAP_TYPE],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
