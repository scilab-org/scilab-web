import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

export type MarkSectionToCompletedPayload = {
  sectionId: string;
  data: {
    memberId: string;
    projectId: string;
  };
};

export const markSectionToCompleted = ({
  sectionId,
  data,
}: MarkSectionToCompletedPayload): Promise<any> => {
  return api.put(
    PAPER_MANAGEMENT_API.MARK_SECTION_TO_COMPLETED(sectionId),
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};

type UseMarkSectionToCompletedOptions = {
  mutationConfig?: MutationConfig<typeof markSectionToCompleted>;
};

export const useMarkSectionToCompleted = ({
  mutationConfig,
}: UseMarkSectionToCompletedOptions = {}) => {
  return useMutation({
    mutationFn: markSectionToCompleted,
    ...mutationConfig,
  });
};
