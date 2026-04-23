import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { USER_MANAGEMENT_API, USER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { CreateUserDto, StringApiCreatedResponse } from '../types';

export const createUser = (
  data: CreateUserDto,
): Promise<StringApiCreatedResponse> => {
  const formData = new FormData();
  if (data.username) formData.append('username', data.username);
  if (data.email) formData.append('email', data.email);
  if (data.ocrId) formData.append('ocrId', data.ocrId);
  if (data.firstName) formData.append('firstName', data.firstName);
  if (data.lastName) formData.append('lastName', data.lastName);
  if (data.initialPassword)
    formData.append('initialPassword', data.initialPassword);
  formData.append('temporaryPassword', String(data.temporaryPassword));
  if (data.groupNames) {
    data.groupNames.forEach((name) => formData.append('groupNames', name));
  }
  if (data.avatarImage) formData.append('avatarImage', data.avatarImage);

  return api.post(USER_MANAGEMENT_API.USERS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

type UseCreateUserOptions = {
  mutationConfig?: MutationConfig<typeof createUser>;
};

export const useCreateUser = ({
  mutationConfig,
}: UseCreateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createUser,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [USER_MANAGEMENT_QUERY_KEYS.USERS],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
  });
};
