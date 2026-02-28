import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { AddProjectPapersRequest } from '../../types';

export const addProjectPapers = async (
  projectId: string,
  data: AddProjectPapersRequest,
) => {
  return api.post(PROJECT_MANAGEMENT_API.ADD_PROJECT_PAPERS(projectId), data);
};

type UseAddProjectPapersOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useAddProjectPapers = ({
  projectId,
  mutationConfig,
}: UseAddProjectPapersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: AddProjectPapersRequest) =>
      addProjectPapers(projectId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PROJECT_PAPERS, projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_PAPERS, projectId],
      });
      onSuccess?.(...(args as Parameters<typeof onSuccess>));
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
