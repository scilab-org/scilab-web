import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { CreateProjectDto } from '../../types';

export const createProject = async (data: CreateProjectDto): Promise<void> => {
  await api.post(PROJECT_MANAGEMENT_API.PROJECTS, data);
};

type UseCreateProjectOptions = {
  mutationConfig?: MutationConfig<typeof createProject>;
};

export const useCreateProject = ({
  mutationConfig,
}: UseCreateProjectOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECTS],
      });
      toast.success('Project created successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createProject,
  });
};
