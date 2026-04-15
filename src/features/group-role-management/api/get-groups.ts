import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { GROUP_ROLE_API, GROUP_ROLE_QUERY_KEYS } from '../constants';
import { GroupDtoListApiGetResponse } from '../types';

export const getGroups = (): Promise<GroupDtoListApiGetResponse> => {
  return api.get(GROUP_ROLE_API.GROUPS);
};

export const getGroupsQueryOptions = () => {
  return queryOptions({
    queryKey: [GROUP_ROLE_QUERY_KEYS.GROUPS],
    queryFn: () => getGroups(),
  });
};

type UseGroupsOptions = {
  queryConfig?: QueryConfig<typeof getGroupsQueryOptions>;
};

export const useGroups = ({ queryConfig }: UseGroupsOptions = {}) => {
  return useQuery({
    ...getGroupsQueryOptions(),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
