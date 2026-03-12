import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetMarkSectionApiResponse } from '../types';

export const getMarkSection = (
  markSectionId: string,
): Promise<GetMarkSectionApiResponse> =>
  api.get(PAPER_MANAGEMENT_API.MARK_SECTION(markSectionId), {
    params: { markSectionId },
  });

export const useMarkSection = ({
  markSectionId,
  queryConfig,
}: {
  markSectionId: string | null;
  queryConfig?: QueryConfig<typeof getMarkSection>;
}) =>
  useQuery({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION, markSectionId],
    queryFn: () => getMarkSection(markSectionId!),
    enabled: !!markSectionId,
    ...queryConfig,
  });
