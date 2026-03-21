import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { COMMENT_API, COMMENT_QUERY_KEYS } from '../constants';
import { GetSectionCommentsApiResponse } from '../types';

export const getSectionComments = ({
  sectionId,
}: {
  sectionId: string;
}): Promise<GetSectionCommentsApiResponse> => {
  return api.get(COMMENT_API.SECTION_COMMENTS(sectionId));
};

export const getSectionCommentsQueryOptions = (sectionId: string) => {
  return queryOptions({
    queryKey: [COMMENT_QUERY_KEYS.SECTION_COMMENTS, sectionId],
    queryFn: () => getSectionComments({ sectionId }),
    enabled: !!sectionId,
  });
};

type UseSectionCommentsOptions = {
  sectionId: string;
  queryConfig?: QueryConfig<typeof getSectionCommentsQueryOptions>;
};

export const useSectionComments = ({
  sectionId,
  queryConfig,
}: UseSectionCommentsOptions) => {
  return useQuery({
    ...getSectionCommentsQueryOptions(sectionId),
    ...queryConfig,
  });
};
