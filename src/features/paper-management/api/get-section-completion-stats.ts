import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type SectionCompletionStats = {
  numberOfCompleteSection: number;
  totalSection: number;
};

type GetSectionCompletionStatsApiResponse = {
  result: SectionCompletionStats;
};

const normalizeSectionCompletionStats = (
  payload: unknown,
): GetSectionCompletionStatsApiResponse => {
  const record = (payload ?? {}) as Record<string, unknown>;
  const result = (record.result ?? {}) as Record<string, unknown>;

  return {
    result: {
      numberOfCompleteSection: Number(result.numberOfCompleteSection ?? 0),
      totalSection: Number(result.totalSection ?? 0),
    },
  };
};

export const getSectionCompletionStats = async (
  sectionId: string,
): Promise<GetSectionCompletionStatsApiResponse> => {
  const response = await api.get(
    `/lab-service/sections/${sectionId}/number-of-complete-section`,
  );
  return normalizeSectionCompletionStats(response);
};

export const useSectionCompletionStats = ({
  sectionId,
  queryConfig,
}: {
  sectionId: string | null;
  queryConfig?: QueryConfig<typeof getSectionCompletionStats>;
}) => {
  return useQuery({
    queryKey: ['section-completion-stats', sectionId],
    queryFn: () => getSectionCompletionStats(sectionId!),
    enabled: !!sectionId,
    staleTime: 0,
    refetchOnMount: 'always',
    ...queryConfig,
  });
};
