import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPaperVersionFilesApiResponse } from '../types';

export const getPaperVersionFiles = ({
  paperId,
  versionId,
}: {
  paperId: string;
  versionId: string;
}): Promise<GetPaperVersionFilesApiResponse> => {
  return api.get(PAPER_MANAGEMENT_API.PAPER_VERSION_FILES(paperId, versionId));
};

export const getPaperVersionFilesQueryOptions = (
  paperId: string,
  versionId: string,
) => {
  return queryOptions({
    queryKey: [
      PAPER_MANAGEMENT_QUERY_KEYS.PAPER_VERSION_FILES,
      paperId,
      versionId,
    ],
    queryFn: () => getPaperVersionFiles({ paperId, versionId }),
    enabled: !!paperId && !!versionId,
  });
};

type UseGetPaperVersionFilesOptions = {
  paperId: string;
  versionId: string;
};

export const useGetPaperVersionFiles = ({
  paperId,
  versionId,
}: UseGetPaperVersionFilesOptions) => {
  return useQuery({
    ...getPaperVersionFilesQueryOptions(paperId, versionId),
  });
};
