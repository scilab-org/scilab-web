import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

export const markMainSection = ({
  versionSectionId,
  projectId,
}: {
  versionSectionId: string;
  projectId: string;
}): Promise<any> => {
  return api.put(
    PAPER_MANAGEMENT_API.MARK_MAIN_SECTION(versionSectionId),
    { projectId },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};

type UseMarkMainSectionOptions = {
  mutationConfig?: MutationConfig<typeof markMainSection>;
};

export const useMarkMainSection = ({
  mutationConfig,
}: UseMarkMainSectionOptions = {}) => {
  return useMutation({
    onSuccess: (...args) => {
      // do nothing in the hook, let the component decide what to do
      if (mutationConfig?.onSuccess) {
        mutationConfig.onSuccess(...args);
      }
    },
    ...mutationConfig,
    mutationFn: markMainSection,
  });
};
