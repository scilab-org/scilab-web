import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

export type UpdateCombineVersionDto = {
  content: string;
  projectId: string;
};

export type UpdateCombineVersionResponse = {
  result: {
    combine: {
      id: string;
      name: string;
      content: string;
      references: string[] | null;
      isSave: boolean;
      createdBy: string | null;
      createdOnUtc: string | null;
      lastModifiedBy: string | null;
      lastModifiedOnUtc: string | null;
    };
  };
};

export const updateCombineVersion = async ({
  paperId,
  versionId,
  data,
}: {
  paperId: string;
  versionId: string;
  data: UpdateCombineVersionDto;
}): Promise<UpdateCombineVersionResponse> => {
  return api.put(
    PAPER_MANAGEMENT_API.COMBINE_VERSION(paperId, versionId),
    data,
  );
};

type UseUpdateCombineVersionOptions = {
  mutationConfig?: MutationConfig<typeof updateCombineVersion>;
};

export const useUpdateCombineVersion = ({
  mutationConfig,
}: UseUpdateCombineVersionOptions = {}) => {
  return useMutation({
    mutationFn: updateCombineVersion,
    ...mutationConfig,
  });
};
