import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { TAG_MANAGEMENT_API, TAG_MANAGEMENT_QUERY_KEYS } from '../constants';
import { BooleanApiDeletedResponse } from '../types';

export const deleteTag = ({
  tagId,
}: {
  tagId: string;
}): Promise<BooleanApiDeletedResponse> => {
  return api.delete(TAG_MANAGEMENT_API.ADMIN_TAG_BY_ID(tagId));
};

type UseDeleteTagOptions = {
  mutationConfig?: MutationConfig<typeof deleteTag>;
};

export const useDeleteTag = ({ mutationConfig }: UseDeleteTagOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [TAG_MANAGEMENT_QUERY_KEYS.TAGS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
