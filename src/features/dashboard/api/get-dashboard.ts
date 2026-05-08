import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getUserGroups } from '@/lib/auth';
import { QueryConfig } from '@/lib/react-query';

import { DASHBOARD_API, DASHBOARD_QUERY_KEYS } from '../constants';
import { DashboardResponse } from '../types';

const getDashboard = (): Promise<DashboardResponse> => {
  const isAdmin = getUserGroups().includes('system:admin');
  return api.get(
    isAdmin ? DASHBOARD_API.ADMIN_DASHBOARD : DASHBOARD_API.USER_DASHBOARD,
  );
};

export const getDashboardQueryOptions = () =>
  queryOptions({
    queryKey: [DASHBOARD_QUERY_KEYS.DASHBOARD],
    queryFn: getDashboard,
    staleTime: 1000 * 60 * 2,
  });

type UseDashboardOptions = {
  queryConfig?: QueryConfig<typeof getDashboardQueryOptions>;
};

export const useDashboard = ({ queryConfig }: UseDashboardOptions = {}) =>
  useQuery({
    ...getDashboardQueryOptions(),
    ...queryConfig,
  });
