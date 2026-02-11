import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../constants';

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(PROJECT_MANAGEMENT_API.ADMIN_PROJECT_BY_ID(projectId));
};

type UseDeleteProjectOptions = {
  mutationConfig?: MutationConfig<typeof deleteProject>;
};

export const useDeleteProject = ({
  mutationConfig,
}: UseDeleteProjectOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECTS],
      });
      toast.success('Project deleted successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteProject,
  });
};
