import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  CHECKLIST_MANAGEMENT_API,
  CHECKLIST_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetCheckListByIdApiResponse } from '../types';

export const getCheckList = (
  checkListId: string,
): Promise<GetCheckListByIdApiResponse> => {
  return api.get(CHECKLIST_MANAGEMENT_API.CHECK_LIST_BY_ID(checkListId));
};

export const getCheckListQueryOptions = (checkListId: string) => {
  return queryOptions({
    queryKey: [CHECKLIST_MANAGEMENT_QUERY_KEYS.CHECK_LIST, checkListId],
    queryFn: () => getCheckList(checkListId),
  });
};

type UseCheckListOptions = {
  checkListId: string;
  queryConfig?: QueryConfig<typeof getCheckListQueryOptions>;
};

export const useCheckList = ({
  checkListId,
  queryConfig,
}: UseCheckListOptions) => {
  return useQuery({
    ...getCheckListQueryOptions(checkListId),
    ...queryConfig,
  });
};
