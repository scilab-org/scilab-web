import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  DATASET_MANAGEMENT_API,
  DATASET_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { UpdateDatasetDto } from '../types';

export const updateDataset = async (data: UpdateDatasetDto): Promise<void> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('description', data.description);
  if (data.file) {
    formData.append('file', data.file);
  }

  await api.put(
    DATASET_MANAGEMENT_API.DATASET_BY_ID(data.datasetId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
};

type UseUpdateDatasetOptions = {
  projectId?: string;
  mutationConfig?: MutationConfig<typeof updateDataset>;
};

export const useUpdateDataset = ({
  projectId: _projectId,
  mutationConfig,
}: UseUpdateDatasetOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DATASET_MANAGEMENT_QUERY_KEYS.DATASETS],
      });
      toast.success('Dataset updated successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateDataset,
  });
};
