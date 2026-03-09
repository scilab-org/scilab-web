import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export const deletePaperContributor = (id: string): Promise<unknown> => {
  return api.delete(PAPER_MANAGEMENT_API.PAPER_CONTRIBUTOR_BY_ID(id));
};

export const useDeletePaperContributor = ({
  sectionId,
  paperId,
  mutationConfig,
}: {
  sectionId: string;
  paperId: string;
  mutationConfig?: any;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};
  return useMutation({
    mutationFn: (id: string) => deletePaperContributor(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.SECTION_MEMBERS,
          sectionId,
          paperId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.AVAILABLE_SECTION_MEMBERS,
          sectionId,
          paperId,
        ],
      });
      onSuccess?.(...(args as Parameters<typeof onSuccess>));
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
