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
    projectId: data.projectId,
    title: data.title,
    template: data.template,
    context: data.context,
    abstract: data.abstract,
    researchGap: data.researchGap,
    gapType: data.gapType,
    mainContribution: data.mainContribution,
    status: data.status,
    journal: data.journal,
    sections: data.sections?.map((section) => ({
      ...section,
      ...(section.packages ? { Packages: section.packages } : {}),
    })),
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
