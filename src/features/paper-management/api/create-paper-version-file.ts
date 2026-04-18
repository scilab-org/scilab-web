import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  CreatePaperVersionFilePayload,
  TransitionPaperStatusApiResponse,
} from '../types';

export const createPaperVersionFile = ({
  paperId,
  versionId,
  data,
}: {
  paperId: string;
  versionId: string;
  data: CreatePaperVersionFilePayload;
}): Promise<TransitionPaperStatusApiResponse> => {
  const formData = new FormData();
  formData.append('file', data.file);
  if (data.note) formData.append('note', data.note);

  return api.post(
    PAPER_MANAGEMENT_API.PAPER_VERSION_FILES(paperId, versionId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
};

type UseCreatePaperVersionFileOptions = {
  paperId: string;
  versionId: string;
  mutationConfig?: Omit<
    UseMutationOptions<
      TransitionPaperStatusApiResponse,
      Error,
      CreatePaperVersionFilePayload
    >,
    'mutationFn'
  >;
};

export const useCreatePaperVersionFile = ({
  paperId,
  versionId,
  mutationConfig,
}: UseCreatePaperVersionFileOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: CreatePaperVersionFilePayload) =>
      createPaperVersionFile({ paperId, versionId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.PAPER_VERSION_FILES,
          paperId,
          versionId,
        ],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
