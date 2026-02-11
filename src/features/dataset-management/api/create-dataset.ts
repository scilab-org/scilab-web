import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  DATASET_MANAGEMENT_API,
  DATASET_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { CreateDatasetDto } from '../types';

export const createDataset = async (data: CreateDatasetDto): Promise<void> => {
  const formData = new FormData();
  formData.append('projectId', data.projectId);
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('file', data.file);

  await api.post(DATASET_MANAGEMENT_API.MANAGER_DATASETS, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

type UseCreateDatasetOptions = {
  projectId: string;
  mutationConfig?: MutationConfig<typeof createDataset>;
};

export const useCreateDataset = ({
  projectId: _projectId,
  mutationConfig,
}: UseCreateDatasetOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DATASET_MANAGEMENT_QUERY_KEYS.DATASETS],
      });
      toast.success('Dataset added successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createDataset,
  });
};
