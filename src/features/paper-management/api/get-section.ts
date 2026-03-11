import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

type SectionDetail = {
  id: string;
  title: string;
  content: string;
  numbered: boolean;
  displayOrder: number;
  sectionSumary: string;
  parentSectionId: string | null;
  memberId: string;
};

type GetSectionApiResponse = {
  result: SectionDetail;
};

export const getSection = (sectionId: string): Promise<GetSectionApiResponse> =>
  api.get(PAPER_MANAGEMENT_API.SECTION_BY_ID(sectionId));

export const useGetSection = ({
  sectionId,
  queryConfig,
}: {
  sectionId: string | null;
  queryConfig?: QueryConfig<typeof getSection>;
}) => {
  return useQuery({
    queryKey: ['section', sectionId],
    queryFn: () => getSection(sectionId!),
    enabled: !!sectionId,
    ...queryConfig,
  });
};
