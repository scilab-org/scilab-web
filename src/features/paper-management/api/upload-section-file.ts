import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

type UploadSectionFilePayload = {
  sectionId: string;
  file: File;
};

const normalizeUploadResponse = (response: unknown): string | null => {
  if (typeof response === 'string') return response;

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;

    if (typeof record.value === 'string') return record.value;
    if (typeof record.result === 'string') return record.result;
  }

  return null;
};

export const uploadSectionFile = async ({
  sectionId,
  file,
}: UploadSectionFilePayload): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.put(
    PAPER_MANAGEMENT_API.SECTION_UPLOAD_FILE(sectionId),
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return normalizeUploadResponse(response);
};

type UseUploadSectionFileOptions = {
  mutationConfig?: MutationConfig<typeof uploadSectionFile>;
};

export const useUploadSectionFile = ({
  mutationConfig,
}: UseUploadSectionFileOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: uploadSectionFile,
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
