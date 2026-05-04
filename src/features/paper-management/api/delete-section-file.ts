import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

type DeleteSectionFilePayload = {
  sectionId: string;
  fileName: string;
};

export const deleteSectionFile = ({
  sectionId,
  fileName,
}: DeleteSectionFilePayload): Promise<unknown> => {
  return api.delete(
    PAPER_MANAGEMENT_API.SECTION_FILE_BY_NAME(sectionId, fileName),
  );
};

type UseDeleteSectionFileOptions = {
  mutationConfig?: MutationConfig<typeof deleteSectionFile>;
};

export const useDeleteSectionFile = ({
  mutationConfig,
}: UseDeleteSectionFileOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: deleteSectionFile,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.SECTION_FILES,
          variables.sectionId,
        ],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
