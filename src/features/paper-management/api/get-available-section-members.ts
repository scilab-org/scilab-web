import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetAvailableSectionMembersApiResponse } from '../types';

export const getAvailableSectionMembers = ({
  sectionId,
  paperId,
}: {
  sectionId: string;
  paperId: string;
}): Promise<GetAvailableSectionMembersApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.AVAILABLE_SECTION_MEMBERS(sectionId), {
    params: { paperId },
  });
};

export const useAvailableSectionMembers = ({
  sectionId,
  paperId,
  queryConfig,
}: {
  sectionId: string;
  paperId: string;
  queryConfig?: QueryConfig<typeof getAvailableSectionMembers>;
}) => {
  return useQuery({
    queryKey: [
      PAPER_MANAGEMENT_QUERY_KEYS.AVAILABLE_SECTION_MEMBERS,
      sectionId,
      paperId,
    ],
    queryFn: () => getAvailableSectionMembers({ sectionId, paperId }),
    ...queryConfig,
  });
};
