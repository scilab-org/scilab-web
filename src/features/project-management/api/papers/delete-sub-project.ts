import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

export const deleteSubProject = (subProjectId: string) =>
  api.delete(PROJECT_MANAGEMENT_API.DELETE_SUB_PROJECT(subProjectId));

type UseDeleteSubProjectOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useDeleteSubProject = ({
  projectId,
  mutationConfig,
}: UseDeleteSubProjectOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (subProjectId: string) => deleteSubProject(subProjectId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.SUB_PROJECTS, projectId],
      });
      onSuccess?.(...(args as Parameters<typeof onSuccess>));
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
