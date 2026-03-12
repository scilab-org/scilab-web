import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';

const normalizeSectionFiles = (response: unknown): string[] => {
  if (Array.isArray(response)) {
    return response.filter((item): item is string => typeof item === 'string');
  }

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;

    if (Array.isArray(record.result)) {
      return record.result.filter(
        (item): item is string => typeof item === 'string',
      );
    }

    if (record.result && typeof record.result === 'object') {
      const resultObj = record.result as Record<string, unknown>;
      if (Array.isArray(resultObj.items)) {
        return resultObj.items.filter(
          (item): item is string => typeof item === 'string',
        );
      }
    }
  }

  return [];
};

export const getSectionFiles = async (sectionId: string): Promise<string[]> => {
  const response = await api.get(PAPER_MANAGEMENT_API.SECTION_FILES(sectionId));
  return normalizeSectionFiles(response);
};

export const useGetSectionFiles = ({
  sectionId,
  queryConfig,
}: {
  sectionId: string | null;
  queryConfig?: QueryConfig<typeof getSectionFiles>;
}) => {
  return useQuery({
    queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.SECTION_FILES, sectionId],
    queryFn: () => getSectionFiles(sectionId!),
    enabled: !!sectionId,
    ...queryConfig,
  });
};
