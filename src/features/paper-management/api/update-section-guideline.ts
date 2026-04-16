import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export type UpdateSectionGuidelinePayload = {
  sectionId: string;
  description: string;
  mainIdea?: string;
};

export const updateSectionGuideline = ({
  sectionId,
  description,
  mainIdea,
}: UpdateSectionGuidelinePayload): Promise<unknown> => {
  return api.put(PAPER_MANAGEMENT_API.SECTION_GUIDELINE(sectionId), {
    description,
    mainIdea,
  });
};

type UseUpdateSectionGuidelineOptions = {
  mutationConfig?: MutationConfig<typeof updateSectionGuideline>;
};

export const useUpdateSectionGuideline = ({
  mutationConfig,
}: UseUpdateSectionGuidelineOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateSectionGuideline,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
