import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

type AddSubProjectMembersRequest = {
  members: Array<{
    userId: string;
    groupName: string;
  }>;
};

export const addSubProjectMembers = async (
  subProjectId: string,
  data: AddSubProjectMembersRequest,
) => {
  return api.post(
    PROJECT_MANAGEMENT_API.ADD_SUB_PROJECT_MEMBERS(subProjectId),
    data,
  );
};

type UseAddSubProjectMembersOptions = {
  subProjectId: string;
  mutationConfig?: any;
};

export const useAddSubProjectMembers = ({
  subProjectId,
  mutationConfig,
}: UseAddSubProjectMembersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    mutationFn: (data: AddSubProjectMembersRequest) =>
      addSubProjectMembers(subProjectId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PAPER_MEMBERS, subProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PAPER_MEMBERS_AVAILABLE],
      });
      onSuccess?.(...(args as Parameters<typeof onSuccess>));
    },
    onError: (...args) => {
      onError?.(...(args as Parameters<typeof onError>));
    },
    ...restConfig,
  });
};
