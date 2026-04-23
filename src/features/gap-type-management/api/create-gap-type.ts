import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  GAP_TYPE_MANAGEMENT_API,
  GAP_TYPE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateGapTypeDto, StringApiCreatedResponse } from '../types';

export const createGapType = (
  data: CreateGapTypeDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(GAP_TYPE_MANAGEMENT_API.ADMIN_GAP_TYPES, data);
};

type UseCreateGapTypeOptions = {
  mutationConfig?: MutationConfig<typeof createGapType>;
};

export const useCreateGapType = ({
  mutationConfig,
}: UseCreateGapTypeOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createGapType,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [GAP_TYPE_MANAGEMENT_QUERY_KEYS.GAP_TYPES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
