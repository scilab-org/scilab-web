import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

export type CombinePaperDto = {
  isPreview: boolean;
  content?: string;
  projectId: string;
};

export type CombinePaperResponse = {
  value: {
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

export const combinePaper = async ({
  paperId,
  data,
}: {
  paperId: string;
  data: CombinePaperDto;
}): Promise<CombinePaperResponse> => {
  return api.post(PAPER_MANAGEMENT_API.COMBINE_PAPER(paperId), data);
};

type UseCombinePaperOptions = {
  mutationConfig?: MutationConfig<typeof combinePaper>;
};

export const useCombinePaper = ({
  mutationConfig,
}: UseCombinePaperOptions = {}) => {
  return useMutation({
    mutationFn: combinePaper,
    ...mutationConfig,
  });
};
