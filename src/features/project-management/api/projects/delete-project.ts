import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

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
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { errors?: { errorMessage?: string }[] } };
      };
      const errorMessage =
        axiosError?.response?.data?.errors?.[0]?.errorMessage;

      if (errorMessage === 'PROJECT_HAS_PAPER') {
        toast.error(
          'Cannot delete this project because it still has papers associated with it. Please remove all papers first.',
        );
      } else {
        toast.error('Failed to delete project. Please try again.');
      }
    },
    ...restConfig,
    mutationFn: deleteProject,
  });
};
