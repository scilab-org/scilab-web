import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetSectionMembersApiResponse } from '../types';

export const getSectionMembers = ({
  sectionId,
  paperId,
}: {
  sectionId: string;
  paperId: string;
}): Promise<GetSectionMembersApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.SECTION_MEMBERS(sectionId), {
    params: { paperId },
  });
};

export const useGetSectionMembers = ({
  sectionId,
  paperId,
  queryConfig,
}: {
  sectionId: string;
  paperId: string;
  queryConfig?: QueryConfig<typeof getSectionMembers>;
}) => {
  return useQuery({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.SECTION_MEMBERS, sectionId, paperId],
    queryFn: () => getSectionMembers({ sectionId, paperId }),
    ...queryConfig,
  });
};
