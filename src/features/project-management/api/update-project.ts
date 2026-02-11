import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { UpdateProjectDto } from '../types';

export type UpdateProjectPayload = {
  projectId: string;
  data: UpdateProjectDto;
};

export const updateProject = ({
  projectId,
  data,
}: UpdateProjectPayload): Promise<void> => {
  return api.put(PROJECT_MANAGEMENT_API.ADMIN_PROJECT_BY_ID(projectId), data);
};

type UseUpdateProjectOptions = {
  mutationConfig?: MutationConfig<typeof updateProject>;
};

export const useUpdateProject = ({
  mutationConfig,
}: UseUpdateProjectOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECTS],
      });
      toast.success('Project updated successfully');
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
