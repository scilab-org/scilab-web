import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { GROUP_ROLE_API, GROUP_ROLE_QUERY_KEYS } from '../constants';
import { RoleDtoListApiGetResponse } from '../types';

export const getRealmRoles = (): Promise<RoleDtoListApiGetResponse> => {
  return api.get(GROUP_ROLE_API.REALM_ROLES);
};

export const getRealmRolesQueryOptions = () => {
  return queryOptions({
    queryKey: [GROUP_ROLE_QUERY_KEYS.REALM_ROLES],
    queryFn: () => getRealmRoles(),
  });
};

type UseRealmRolesOptions = {
  queryConfig?: QueryConfig<typeof getRealmRolesQueryOptions>;
};

export const useRealmRoles = ({ queryConfig }: UseRealmRolesOptions = {}) => {
  return useQuery({
    ...getRealmRolesQueryOptions(),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
