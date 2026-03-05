import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

type RemovePaperMembersBody = {
  memberIds: string[];
};

export const removePaperMembers = (
  subProjectId: string,
  body: RemovePaperMembersBody,
) => api.post(PROJECT_MANAGEMENT_API.REMOVE_PAPER_MEMBERS(subProjectId), body);

type UseRemovePaperMembersOptions = {
  subProjectId: string;
  mutationConfig?: any;
};

export const useRemovePaperMembers = ({
  subProjectId,
  mutationConfig,
}: UseRemovePaperMembersOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};
  return useMutation({
    mutationFn: (body: RemovePaperMembersBody) =>
      removePaperMembers(subProjectId, body),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PAPER_MEMBERS, subProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.PAPER_MEMBERS_AVAILABLE],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
