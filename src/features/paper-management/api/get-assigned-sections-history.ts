import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  GetAssignedSectionsHistoryApiResponse,
  GetAssignedSectionsHistoryParams,
} from '../types';

export const getAssignedSectionsHistory = ({
  paperId,
  params,
}: {
  paperId: string;
  params?: GetAssignedSectionsHistoryParams;
}): Promise<GetAssignedSectionsHistoryApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.ASSIGNED_SECTIONS_HISTORY(paperId), {
    params,
  });
};

export const getAssignedSectionsHistoryQueryOptions = (
  paperId: string,
  params?: GetAssignedSectionsHistoryParams,
) => {
  return queryOptions({
    queryKey: [
      PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS_HISTORY,
      paperId,
      params,
    ],
    queryFn: () => getAssignedSectionsHistory({ paperId, params }),
    enabled: !!paperId,
  });
};

type UseAssignedSectionsHistoryOptions = {
  paperId: string;
  params?: GetAssignedSectionsHistoryParams;
  queryConfig?: QueryConfig<typeof getAssignedSectionsHistoryQueryOptions>;
};

export const useAssignedSectionsHistory = ({
  paperId,
  params,
  queryConfig,
}: UseAssignedSectionsHistoryOptions) => {
  return useQuery({
    ...getAssignedSectionsHistoryQueryOptions(paperId, params),
    ...queryConfig,
  });
};
