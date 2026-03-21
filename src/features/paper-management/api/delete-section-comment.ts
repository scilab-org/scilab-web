import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { COMMENT_API, COMMENT_QUERY_KEYS } from '../constants';

export const deleteSectionComment = ({ id }: { id: string }): Promise<any> => {
  return api.delete(COMMENT_API.COMMENT_BY_ID(id));
};

type UseDeleteSectionCommentOptions = {
  mutationConfig?: MutationConfig<typeof deleteSectionComment>;
  sectionId?: string;
};

export const useDeleteSectionComment = ({
  mutationConfig,
  sectionId,
}: UseDeleteSectionCommentOptions = {}) => {
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
    mutationFn: deleteSectionComment,
  });
};
