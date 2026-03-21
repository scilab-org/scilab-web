import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { COMMENT_API, COMMENT_QUERY_KEYS } from '../constants';
import { CreateCommentDto } from '../types';

export const createSectionComment = ({
  data,
}: {
  data: CreateCommentDto;
}): Promise<any> => {
  return api.post(COMMENT_API.COMMENTS, data);
};

type UseCreateSectionCommentOptions = {
  mutationConfig?: MutationConfig<typeof createSectionComment>;
  sectionId?: string;
};

export const useCreateSectionComment = ({
  mutationConfig,
  sectionId,
}: UseCreateSectionCommentOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      if (sectionId) {
        queryClient.invalidateQueries({
          queryKey: [COMMENT_QUERY_KEYS.SECTION_COMMENTS, sectionId],
        });
      }

      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createSectionComment,
  });
};
