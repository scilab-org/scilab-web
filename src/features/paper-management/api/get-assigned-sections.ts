import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  GetAssignedSectionsApiResponse,
  GetAssignedSectionsParams,
} from '../types';

export const getAssignedSections = ({
  paperId,
  params,
}: {
  paperId: string;
  params?: GetAssignedSectionsParams;
}): Promise<GetAssignedSectionsApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.ASSIGNED_SECTIONS(paperId), { params });
};

export const getAssignedSectionsQueryOptions = (
  paperId: string,
  params?: GetAssignedSectionsParams,
) => {
  return queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS, paperId, params],
    queryFn: () => getAssignedSections({ paperId, params }),
    enabled: !!paperId,
  });
};

type UseAssignedSectionsOptions = {
  paperId: string;
  params?: GetAssignedSectionsParams;
  queryConfig?: QueryConfig<typeof getAssignedSectionsQueryOptions>;
};

export const useAssignedSections = ({
  paperId,
  params,
  queryConfig,
}: UseAssignedSectionsOptions) => {
  return useQuery({
    ...getAssignedSectionsQueryOptions(paperId, params),
    ...queryConfig,
  });
};
