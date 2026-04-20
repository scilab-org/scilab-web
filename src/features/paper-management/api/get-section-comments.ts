import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { COMMENT_API, COMMENT_QUERY_KEYS } from '../constants';
import { GetSectionCommentsApiResponse } from '../types';

export const getSectionComments = ({
  markSectionId,
}: {
  markSectionId: string;
}): Promise<GetSectionCommentsApiResponse> => {
  return api.get(COMMENT_API.SECTION_COMMENTS(markSectionId));
};

export const getSectionCommentsQueryOptions = (markSectionId: string) => {
  return queryOptions({
    queryKey: [COMMENT_QUERY_KEYS.SECTION_COMMENTS, markSectionId],
    queryFn: () => getSectionComments({ markSectionId }),
    enabled: !!markSectionId,
  });
};

type UseSectionCommentsOptions = {
  sectionId: string;
  markSectionId?: string;
  queryConfig?: QueryConfig<typeof getSectionCommentsQueryOptions>;
};

export const useSectionComments = ({
  sectionId,
  markSectionId,
  queryConfig,
}: UseSectionCommentsOptions) => {
  const queryId = markSectionId || sectionId;
  return useQuery({
    ...getSectionCommentsQueryOptions(queryId),
    ...queryConfig,
  });
};
