import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { CreateDatasetDto } from '../types';

const DATASET_QUERY_KEY = 'datasets';

export const createDataset = async (data: CreateDatasetDto): Promise<void> => {
  const formData = new FormData();
  formData.append('projectId', data.projectId);
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('file', data.file);

  await api.post('/mananger/datasets', formData, {
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
  projectId,
  mutationConfig,
}: UseCreateDatasetOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DATASET_QUERY_KEY, { projectId }],
      });
      toast.success('Dataset added successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createDataset,
  });
};
