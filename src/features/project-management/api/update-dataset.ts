import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { UpdateDatasetDto } from '../types';

const DATASET_QUERY_KEY = 'datasets';

export const updateDataset = async (data: UpdateDatasetDto): Promise<void> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('description', data.description);
  if (data.file) {
    formData.append('file', data.file);
  }

  await api.put(`/mananger/datasets/${data.datasetId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

type UseUpdateDatasetOptions = {
  projectId: string;
  mutationConfig?: MutationConfig<typeof updateDataset>;
};

export const useUpdateDataset = ({
  projectId,
  mutationConfig,
}: UseUpdateDatasetOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DATASET_QUERY_KEY, { projectId }],
      });
      toast.success('Dataset updated successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateDataset,
  });
};
