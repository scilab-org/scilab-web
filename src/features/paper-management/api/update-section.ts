import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { BooleanApiUpdatedResponse, UpdateSectionDto } from '../types';

export type UpdateSectionPayload = {
  sectionId: string;
  data: UpdateSectionDto;
};

export const updateSection = ({
  sectionId,
  data,
}: UpdateSectionPayload): Promise<BooleanApiUpdatedResponse> => {
  return api.put(PAPER_MANAGEMENT_API.SECTION_BY_ID(sectionId), data);
};

type UseUpdateSectionOptions = {
  mutationConfig?: MutationConfig<typeof updateSection>;
};

export const useUpdateSection = ({
  mutationConfig,
}: UseUpdateSectionOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateSection,
    onSuccess: (...args) => {
      // Mark queries stale but don't trigger background refetches.
      // Callers (e.g. the LaTeX editor) manage their own state after save
      // and explicitly refetch when ready. Background refetches would push
      // stale structural IDs into the editor while it's still open.
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS],
        refetchType: 'none',
      });
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS],
        refetchType: 'none',
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
