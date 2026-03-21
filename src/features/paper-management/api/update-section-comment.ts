import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { COMMENT_API, COMMENT_QUERY_KEYS } from '../constants';

export const updateSectionComment = ({
  id,
  data,
}: {
  id: string;
  data: string;
}): Promise<any> => {
  // Pass the raw string wrapped in JSON.stringify to ensure it's a valid JSON string value
  return api.put(COMMENT_API.COMMENT_BY_ID(id), JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

type UseUpdateSectionCommentOptions = {
  mutationConfig?: MutationConfig<typeof updateSectionComment>;
  sectionId?: string;
};

export const useUpdateSectionComment = ({
  mutationConfig,
  sectionId,
}: UseUpdateSectionCommentOptions = {}) => {
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
    mutationFn: updateSectionComment,
  });
};
