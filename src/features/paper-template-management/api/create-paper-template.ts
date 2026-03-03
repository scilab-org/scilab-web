import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_TEMPLATE_MANAGEMENT_API,
  PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreatePaperTemplateDto, StringApiCreatedResponse } from '../types';

export const createPaperTemplate = (
  data: CreatePaperTemplateDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(PAPER_TEMPLATE_MANAGEMENT_API.ADMIN_PAPER_TEMPLATES, data);
};

type UseCreatePaperTemplateOptions = {
  mutationConfig?: MutationConfig<typeof createPaperTemplate>;
};

export const useCreatePaperTemplate = ({
  mutationConfig,
}: UseCreatePaperTemplateOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createPaperTemplate,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS.PAPER_TEMPLATES],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
