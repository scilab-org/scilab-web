import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  CHECKLIST_MANAGEMENT_API,
  CHECKLIST_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateCheckListDto, StringApiCreatedResponse } from '../types';

export const createCheckList = (
  data: CreateCheckListDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(CHECKLIST_MANAGEMENT_API.ADMIN_CHECK_LISTS, data);
};

type UseCreateCheckListOptions = {
  mutationConfig?: MutationConfig<typeof createCheckList>;
};

export const useCreateCheckList = ({
  mutationConfig,
}: UseCreateCheckListOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createCheckList,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [CHECKLIST_MANAGEMENT_QUERY_KEYS.CHECK_LISTS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
