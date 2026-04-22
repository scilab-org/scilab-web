import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { PaperDto } from '../types';

export type SectionReferenceOtherItem = {
  paperBank: PaperDto;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    displayOrder: number;
    paperId: string;
    createdBy: string;
  }>;
};

export type SectionReferenceResponse = {
  result: {
    inUse: PaperDto[];
    otherReference: SectionReferenceOtherItem[];
  };
};

const normalizePaperDto = (paper: unknown): PaperDto => {
  const record = (paper ?? {}) as Record<string, unknown>;

  return {
    id: String(record.id ?? ''),
    title: (record.title as string | null) ?? null,
    abstract: (record.abstract as string | null) ?? null,
    doi: (record.doi as string | null) ?? null,
    authors: (record.authors as string | null) ?? null,
    publisher: (record.publisher as string | null) ?? null,
    number: (record.number as string | null) ?? null,
    pages: (record.pages as string | null) ?? null,
    volume: (record.volume as string | null) ?? null,
    referenceContent: (record.referenceContent as string | null) ?? null,
    filePath: (record.filePath as string | null) ?? null,
    bibFilePath: (record.bibFilePath as string | null) ?? null,
    ranking: (record.ranking as string | null) ?? null,
    url: (record.url as string | null) ?? null,
    isIngested: Boolean(record.isIngested),
    isAutoTagged: Boolean(record.isAutoTagged),
    parsedText: (record.parsedText as string | null) ?? null,
    publicationDate: (record.publicationDate as string | null) ?? null,
    paperType: (record.paperType as string | null) ?? null,
    conferenceJournalName:
      (record.conferenceJournalName as string | null) ?? null,
    keywords: Array.isArray(record.keywords)
      ? record.keywords.filter((kw): kw is string => typeof kw === 'string')
      : [],
    createdOnUtc: (record.createdOnUtc as string | null) ?? null,
    createdBy: (record.createdBy as string | null) ?? null,
    lastModifiedOnUtc: (record.lastModifiedOnUtc as string | null) ?? null,
    lastModifiedBy: (record.lastModifiedBy as string | null) ?? null,
  };
};

const normalizeSectionReference = (
  response: unknown,
): SectionReferenceResponse => {
  const record = (response ?? {}) as Record<string, unknown>;
  const result = (record.result ?? {}) as Record<string, unknown>;

  return {
    result: {
      inUse: Array.isArray(result.inUse)
        ? result.inUse.map((paper) => normalizePaperDto(paper))
        : [],
      otherReference: Array.isArray(result.otherReference)
        ? result.otherReference.map((item) => {
            const itemRecord = (item ?? {}) as Record<string, unknown>;

            return {
              paperBank: normalizePaperDto(itemRecord.paperBank),
              sections: Array.isArray(itemRecord.sections)
                ? itemRecord.sections.map((section) => {
                    const sectionRecord = section as Record<string, unknown>;

                    return {
                      id: String(sectionRecord.id ?? ''),
                      title: String(sectionRecord.title ?? ''),
                      content: String(sectionRecord.content ?? ''),
                      displayOrder: Number(sectionRecord.displayOrder ?? 0),
                      paperId: String(sectionRecord.paperId ?? ''),
                      createdBy: String(sectionRecord.createdBy ?? ''),
                    };
                  })
                : [],
            };
          })
        : [],
    },
  };
};

export const getSectionReference = (
  sectionId: string,
): Promise<SectionReferenceResponse> => {
  return api
    .get(PAPER_MANAGEMENT_API.SECTION_REFERENCE(sectionId))
    .then(normalizeSectionReference);
};

export const useGetSectionReference = ({
  sectionId,
  queryConfig,
}: {
  sectionId: string | null;
  queryConfig?: QueryConfig<typeof getSectionReference>;
}) => {
  return useQuery({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.SECTION_REFERENCE, sectionId],
    queryFn: () => getSectionReference(sectionId!),
    enabled: !!sectionId,
    ...queryConfig,
  });
};
