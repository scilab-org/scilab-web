import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

const DATASET_QUERY_KEY = 'datasets';

export const deleteDataset = async (datasetId: string): Promise<void> => {
  await api.delete(`/mananger/datasets/${datasetId}`);
};

type UseDeleteDatasetOptions = {
  projectId: string;
  mutationConfig?: MutationConfig<typeof deleteDataset>;
};

export const useDeleteDataset = ({
  projectId,
  mutationConfig,
}: UseDeleteDatasetOptions) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [DATASET_QUERY_KEY, { projectId }],
      });
      toast.success('Dataset deleted successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteDataset,
  });
};
