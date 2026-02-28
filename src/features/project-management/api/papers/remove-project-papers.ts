import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';
import { RemoveProjectPapersRequest } from '../../types';

export const removeProjectPapers = async (
  projectId: string,
  data: RemoveProjectPapersRequest,
) => {
  return api.post(
    PROJECT_MANAGEMENT_API.REMOVE_PROJECT_PAPERS(projectId),
    data,
  );
};

type UseRemoveProjectPapersOptions = {
  projectId: string;
  mutationConfig?: any;
};

export const useRemoveProjectPapers = ({
  projectId,
  mutationConfig,
}: UseRemoveProjectPapersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: RemoveProjectPapersRequest) =>
      removeProjectPapers(projectId, data),
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
