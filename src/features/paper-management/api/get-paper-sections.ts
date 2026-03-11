import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { PaperSection } from '../types';

type GetPaperSectionsApiResponse = {
  result: {
    paperId: string;
    items: PaperSection[];
  };
};

export const getPaperSections = (
  paperId: string,
): Promise<GetPaperSectionsApiResponse> =>
  api.get(PAPER_MANAGEMENT_API.PAPER_SECTIONS_BY_ID(paperId));

export const getPaperSectionsQueryOptions = (paperId: string) =>
  queryOptions({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS, paperId],
    queryFn: () => getPaperSections(paperId),
    enabled: !!paperId,
  });

export const useGetPaperSections = ({
  paperId,
  queryConfig,
}: {
  paperId: string;
  queryConfig?: QueryConfig<typeof getPaperSectionsQueryOptions>;
}) => {
  return useQuery({
    ...getPaperSectionsQueryOptions(paperId),
    ...queryConfig,
  });
};
