import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export type UpdatePaperContributorDto = {
  sectionRole: string;
  sectionId: string;
  memberId: string;
  markSectionId: string;
};

export const updatePaperContributor = (
  id: string,
  data: UpdatePaperContributorDto,
): Promise<unknown> => {
  return api.put(PAPER_MANAGEMENT_API.PAPER_CONTRIBUTOR_BY_ID(id), data);
};

export const useUpdatePaperContributor = ({
  sectionId,
  paperId,
  mutationConfig,
}: {
  sectionId: string;
  paperId: string;
  mutationConfig?: any;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaperContributorDto;
    }) => updatePaperContributor(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.SECTION_MEMBERS,
          sectionId,
          paperId,
        ],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
