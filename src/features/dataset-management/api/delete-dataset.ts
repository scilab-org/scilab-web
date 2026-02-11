import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  DATASET_MANAGEMENT_API,
  DATASET_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export const deleteDataset = async (datasetId: string): Promise<void> => {
  await api.delete(DATASET_MANAGEMENT_API.DATASET_BY_ID(datasetId));
};

type UseDeleteDatasetOptions = {
  mutationConfig?: MutationConfig<typeof deleteDataset>;
};

export const useDeleteDataset = ({
  mutationConfig,
}: UseDeleteDatasetOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DATASET_MANAGEMENT_QUERY_KEYS.DATASETS],
      });
      toast.success('Dataset deleted successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteDataset,
  });
};
