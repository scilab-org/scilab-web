import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreatePaperInProjectDto, StringApiCreatedResponse } from '../types';

export const createPaperInProject = (
  data: CreatePaperInProjectDto,
): Promise<StringApiCreatedResponse> => {
  return api.post(PAPER_MANAGEMENT_API.ADMIN_PAPERS_INITIALIZE, {
    ProjectId: data.projectId,
    Title: data.title,
    Context: data.context,
    Template: data.template,
    Status: data.status,
    PaperType: data.paperType,
    Sections: data.sections,
  });
};

type UseCreatePaperInProjectOptions = {
  mutationConfig?: MutationConfig<typeof createPaperInProject>;
};

export const useCreatePaperInProject = ({
  mutationConfig,
}: UseCreatePaperInProjectOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createPaperInProject,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
