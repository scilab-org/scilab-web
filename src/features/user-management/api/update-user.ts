import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { BooleanApiUpdatedResponse, UpdateUserDto } from '../types';

export type UpdateUserPayload = {
  userId: string;
  data: UpdateUserDto;
};

export const updateUser = ({
  userId,
  data,
}: UpdateUserPayload): Promise<BooleanApiUpdatedResponse> => {
  const formData = new FormData();
  if (data.ocrId) formData.append('ocrId', data.ocrId);
  if (data.firstName) formData.append('firstName', data.firstName);
  if (data.lastName) formData.append('lastName', data.lastName);
  formData.append('enabled', String(data.enabled));
  if (data.groupNames) {
    data.groupNames.forEach((name) => formData.append('groupNames', name));
  }
  if (data.avatarImage) formData.append('avatarImage', data.avatarImage);

  return api.put(USER_MANAGEMENT_API.USER_BY_ID(userId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

type UseUpdateUserOptions = {
  mutationConfig?: MutationConfig<typeof updateUser>;
};

export const useUpdateUser = ({
  mutationConfig,
}: UseUpdateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USER],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
