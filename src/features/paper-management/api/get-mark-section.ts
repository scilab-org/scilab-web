import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetMarkSectionApiResponse } from '../types';

export const getMarkSection = (
  markSectionId: string,
): Promise<GetMarkSectionApiResponse> =>
  api.get(PAPER_MANAGEMENT_API.MARK_SECTION(markSectionId));

export const useMarkSection = ({
  markSectionId,
  queryConfig,
}: {
  markSectionId: string | null;
  queryConfig?: Omit<
    UseQueryOptions<GetMarkSectionApiResponse>,
    'queryKey' | 'queryFn'
  >;
}) =>
  useQuery({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION, markSectionId],
    queryFn: () => getMarkSection(markSectionId!),
    enabled: !!markSectionId,
    ...queryConfig,
  });
