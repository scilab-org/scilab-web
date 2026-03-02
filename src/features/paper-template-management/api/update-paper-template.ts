import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_TEMPLATE_MANAGEMENT_API,
  PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { UpdatePaperTemplateDto } from '../types';

export const updatePaperTemplate = ({
  id,
  data,
}: {
  id: string;
  data: UpdatePaperTemplateDto;
}): Promise<void> => {
  return api.put(
    PAPER_TEMPLATE_MANAGEMENT_API.ADMIN_PAPER_TEMPLATE_BY_ID(id),
    data,
  );
};

type UseUpdatePaperTemplateOptions = {
  mutationConfig?: MutationConfig<typeof updatePaperTemplate>;
};

export const useUpdatePaperTemplate = ({
  mutationConfig,
}: UseUpdatePaperTemplateOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updatePaperTemplate,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS.PAPER_TEMPLATES],
      });
      queryClient.invalidateQueries({
        queryKey: [PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS.PAPER_TEMPLATE],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
