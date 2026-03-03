import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_TEMPLATE_MANAGEMENT_API,
  PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { StringApiCreatedResponse } from '../types';

export const deletePaperTemplate = ({
  id,
}: {
  id: string;
}): Promise<StringApiCreatedResponse> => {
  return api.delete(
    PAPER_TEMPLATE_MANAGEMENT_API.ADMIN_PAPER_TEMPLATE_BY_ID(id),
  );
};

type UseDeletePaperTemplateOptions = {
  mutationConfig?: MutationConfig<typeof deletePaperTemplate>;
};

export const useDeletePaperTemplate = ({
  mutationConfig,
}: UseDeletePaperTemplateOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deletePaperTemplate,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS.PAPER_TEMPLATES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
