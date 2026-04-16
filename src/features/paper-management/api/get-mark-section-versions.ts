import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetMarkSectionVersionsApiResponse } from '../types';

export const getMarkSectionVersions = (
  markSectionId: string,
): Promise<GetMarkSectionVersionsApiResponse> =>
  api.get(PAPER_MANAGEMENT_API.MARK_SECTION_VERSIONS(markSectionId));

export const useMarkSectionVersions = ({
  markSectionId,
  queryConfig,
}: {
  markSectionId: string | null;
  queryConfig?: QueryConfig<typeof getMarkSectionVersions>;
}) =>
  useQuery({
    queryKey: [
      PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION_VERSIONS,
      markSectionId,
    ],
    queryFn: () => getMarkSectionVersions(markSectionId!),
    enabled: !!markSectionId,
    ...queryConfig,
  });
