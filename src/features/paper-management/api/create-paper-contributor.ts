import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export type CreatePaperContributorDto = {
  sectionRole: string;
  paperId: string;
  sectionId: string;
  memberId: string;
  markSectionId: string;
};

export const createPaperContributor = (
  data: CreatePaperContributorDto,
): Promise<unknown> => {
  return api.post(PAPER_MANAGEMENT_API.PAPER_CONTRIBUTORS, data);
};

type UseCreatePaperContributorOptions = {
  paperId: string;
  mutationConfig?: any;
};

export const useCreatePaperContributor = ({
  paperId,
  mutationConfig,
}: UseCreatePaperContributorOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: CreatePaperContributorDto) =>
      createPaperContributor(data),
    onSuccess: (result, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS, paperId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.SECTION_MEMBERS,
          variables.markSectionId,
          paperId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.AVAILABLE_SECTION_MEMBERS,
          variables.markSectionId,
          paperId,
        ],
      });
      onSuccess?.(result, variables, context);
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
