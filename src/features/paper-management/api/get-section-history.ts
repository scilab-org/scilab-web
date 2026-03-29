import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { MarkSectionItem } from '../types';

type GetSectionHistoryResponse = {
  result: {
    items: MarkSectionItem[];
  };
};

export const getSectionHistory = (
  markSectionId: string,
): Promise<GetSectionHistoryResponse> =>
  api.get(PAPER_MANAGEMENT_API.SECTION_HISTORY(markSectionId));

export const useSectionHistory = ({
  markSectionId,
  queryConfig,
}: {
  markSectionId: string | null;
  queryConfig?: QueryConfig<typeof getSectionHistory>;
}) =>
  useQuery({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.SECTION_HISTORY, markSectionId],
    queryFn: () => getSectionHistory(markSectionId!),
    enabled: !!markSectionId,
    ...queryConfig,
  });
