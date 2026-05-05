import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { DASHBOARD_API, DASHBOARD_QUERY_KEYS } from '../constants';
import { DashboardResponse } from '../types';

const getDashboard = (): Promise<DashboardResponse> =>
  api.get(DASHBOARD_API.DASHBOARD);

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
