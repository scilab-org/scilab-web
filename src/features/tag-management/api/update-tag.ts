import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { TAG_MANAGEMENT_API, TAG_MANAGEMENT_QUERY_KEYS } from '../constants';
import { BooleanApiUpdatedResponse, UpdateTagDto } from '../types';

export type UpdateTagPayload = {
  tagId: string;
  data: UpdateTagDto;
};

export const updateTag = ({
  tagId,
  data,
}: UpdateTagPayload): Promise<BooleanApiUpdatedResponse> => {
  return api.put(TAG_MANAGEMENT_API.ADMIN_TAG_BY_ID(tagId), data);
};

type UseUpdateTagOptions = {
  mutationConfig?: MutationConfig<typeof updateTag>;
};

export const useUpdateTag = ({ mutationConfig }: UseUpdateTagOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateTag,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [TAG_MANAGEMENT_QUERY_KEYS.TAGS],
      });
      queryClient.invalidateQueries({
        queryKey: [TAG_MANAGEMENT_QUERY_KEYS.TAG],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
