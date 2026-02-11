import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { TAG_MANAGEMENT_API, TAG_MANAGEMENT_QUERY_KEYS } from '../constants';
import { CreateTagDto, StringApiCreatedResponse } from '../types';

export const createTag = (
  data: CreateTagDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(TAG_MANAGEMENT_API.ADMIN_TAGS, data);
};

type UseCreateTagOptions = {
  mutationConfig?: MutationConfig<typeof createTag>;
};

export const useCreateTag = ({ mutationConfig }: UseCreateTagOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createTag,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [TAG_MANAGEMENT_QUERY_KEYS.TAGS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
