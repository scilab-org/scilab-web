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
  description?: string;
  filePath?: string | null;
  createdOnUtc?: string | null;
  lastModifiedOnUtc?: string | null;
  paperId?: string;
  sectionRole?: string;
  rule?: string;
};

type GetSectionApiResponse = {
  result: SectionDetail;
};

const normalizeSectionDetail = (payload: unknown): GetSectionApiResponse => {
  const record = (payload ?? {}) as Record<string, unknown>;
  const result = (record.result ?? {}) as Record<string, unknown>;

  // New API shape: { result: { section: { ... } } }
  const section = (result.section ?? result) as Record<string, unknown>;

  return {
    result: {
      id: String(section.id ?? ''),
      title: String(section.title ?? ''),
      content: String(section.content ?? ''),
      numbered: Boolean(section.numbered),
      displayOrder: Number(section.displayOrder ?? 0),
      sectionSumary: String(section.sectionSumary ?? ''),
      parentSectionId:
        section.parentSectionId === null ||
        section.parentSectionId === undefined
          ? null
          : String(section.parentSectionId),
      memberId: String(section.memberId ?? ''),
      description:
        section.description === null || section.description === undefined
          ? undefined
          : String(section.description),
      filePath:
        section.filePath === null || section.filePath === undefined
          ? null
          : String(section.filePath),
      createdOnUtc:
        section.createdOnUtc === null || section.createdOnUtc === undefined
          ? null
          : String(section.createdOnUtc),
      lastModifiedOnUtc:
        section.lastModifiedOnUtc === null ||
        section.lastModifiedOnUtc === undefined
          ? null
          : String(section.lastModifiedOnUtc),
      paperId:
        section.paperId === null || section.paperId === undefined
          ? undefined
          : String(section.paperId),
      sectionRole:
        section.sectionRole === null || section.sectionRole === undefined
          ? undefined
          : String(section.sectionRole),
      rule:
        section.rule === null || section.rule === undefined
          ? undefined
          : String(section.rule),
    },
  };
};

export const getSection = async (
  sectionId: string,
): Promise<GetSectionApiResponse> => {
  // Prefer the newer endpoint shape: GET /sections/{id}
  try {
    const response = await api.get(`/sections/${sectionId}`);
    return normalizeSectionDetail(response);
  } catch {
    // Fallback to legacy lab-service route
    const response = await api.get(
      PAPER_MANAGEMENT_API.SECTION_BY_ID(sectionId),
    );
    return normalizeSectionDetail(response);
  }
};

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
    staleTime: 0,
    refetchOnMount: 'always',
    ...queryConfig,
  });
};
