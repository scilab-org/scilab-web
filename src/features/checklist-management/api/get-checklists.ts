import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  CHECKLIST_MANAGEMENT_API,
  CHECKLIST_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetCheckListsParams, GetCheckListsResultApiResponse } from '../types';

export const getCheckLists = (
  params: GetCheckListsParams = {},
): Promise<GetCheckListsResultApiResponse> => {
  return api.get(CHECKLIST_MANAGEMENT_API.CHECK_LISTS, { params });
};

export const getCheckListsQueryOptions = (params: GetCheckListsParams = {}) => {
  return queryOptions({
    queryKey: [CHECKLIST_MANAGEMENT_QUERY_KEYS.CHECK_LISTS, params],
    queryFn: () => getCheckLists(params),
  });
};

type UseCheckListsOptions = {
  params?: GetCheckListsParams;
  queryConfig?: QueryConfig<typeof getCheckListsQueryOptions>;
};

export const useCheckLists = ({
  params = {},
  queryConfig,
}: UseCheckListsOptions = {}) => {
  return useQuery({
    ...getCheckListsQueryOptions(params),
    ...queryConfig,
    placeholderData: keepPreviousData,
  });
};
