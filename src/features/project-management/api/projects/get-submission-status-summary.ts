import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

export type SubmissionStatusSummaryItem = {
  status: number;
  count: number;
};

type SubmissionStatusSummaryResult = {
  items: SubmissionStatusSummaryItem[];
};

type ApiResponse = {
  result: SubmissionStatusSummaryResult;
};

const getSubmissionStatusSummary = (projectId: string): Promise<ApiResponse> =>
  api.get(PROJECT_MANAGEMENT_API.SUBMISSION_STATUS_SUMMARY(projectId));

export const useSubmissionStatusSummary = (projectId: string) =>
  useQuery({
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.SUBMISSION_STATUS_SUMMARY,
      projectId,
    ],
    queryFn: () => getSubmissionStatusSummary(projectId),
    enabled: !!projectId,
  });
