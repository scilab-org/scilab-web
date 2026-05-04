import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  CHECKLIST_MANAGEMENT_API,
  CHECKLIST_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteCheckList = (
  checkListId: string,
): Promise<BooleanApiDeletedResponse> => {
  return api.delete(
    CHECKLIST_MANAGEMENT_API.ADMIN_CHECK_LIST_BY_ID(checkListId),
  );
};

type UseDeleteCheckListOptions = {
  mutationConfig?: MutationConfig<typeof deleteCheckList>;
};

export const useDeleteCheckList = ({
  mutationConfig,
}: UseDeleteCheckListOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteCheckList,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [CHECKLIST_MANAGEMENT_QUERY_KEYS.CHECK_LISTS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
