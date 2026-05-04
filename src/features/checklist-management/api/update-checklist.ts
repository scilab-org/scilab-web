import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  CHECKLIST_MANAGEMENT_API,
  CHECKLIST_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateCheckListDto } from '../types';

export const updateCheckList = ({
  checkListId,
  data,
}: {
  checkListId: string;
  data: UpdateCheckListDto;
}): Promise<BooleanApiUpdatedResponse> => {
  return api.put(
    CHECKLIST_MANAGEMENT_API.ADMIN_CHECK_LIST_BY_ID(checkListId),
    data,
  );
};

type UseUpdateCheckListOptions = {
  mutationConfig?: MutationConfig<typeof updateCheckList>;
};

export const useUpdateCheckList = ({
  mutationConfig,
}: UseUpdateCheckListOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateCheckList,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [CHECKLIST_MANAGEMENT_QUERY_KEYS.CHECK_LISTS],
      });
      queryClient.invalidateQueries({
        queryKey: [CHECKLIST_MANAGEMENT_QUERY_KEYS.CHECK_LIST],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
