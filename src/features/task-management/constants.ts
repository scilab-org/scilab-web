const SERVICE_PREFIX = '/lab-service';

export const TASK_MANAGEMENT_API = {
  TASKS: `${SERVICE_PREFIX}/tasks`,
  TASK_BY_ID: (id: string) => `${SERVICE_PREFIX}/tasks/${id}`,
  PAPER_TASKS: (paperId: string) => `${SERVICE_PREFIX}/tasks/paper/${paperId}`,
  MY_TASKS: `${SERVICE_PREFIX}/tasks/my-tasks`,
  MY_ASSIGNED_PAPERS: '/management-service/projects/me/assigned-papers',
} as const;

export const TASK_MANAGEMENT_QUERY_KEYS = {
  MY_TASKS: 'my-tasks',
  PAPER_TASKS: 'paper-tasks',
  MY_ASSIGNED_PAPERS: 'my-assigned-papers',
} as const;

export const DATE_TASK_FILTER_OPTIONS = [
  { label: 'Start Date', value: 'StartDate' },
  { label: 'Next Review Date', value: 'NextReviewDate' },
  { label: 'Complete Date', value: 'CompleteDate' },
  { label: 'Created On', value: 'CreatedOn' },
] as const;

export const TASK_STATUS_OPTIONS = [
  { label: 'To Do', value: 1 },
  { label: 'In Progress', value: 2 },
  { label: 'In Review', value: 3 },
  { label: 'Completed', value: 4 },
] as const;

export const PAPER_TASK_STATUS_OPTIONS = [
  { label: 'To Do', value: 1 },
  { label: 'In Progress', value: 2 },
  { label: 'In Review', value: 3 },
  { label: 'Completed', value: 4 },
  { label: 'Closed', value: 5 },
] as const;

export const AUTHOR_TASK_STATUS_OPTIONS = TASK_STATUS_OPTIONS;

export const TASK_TYPE_OPTIONS = [
  { label: 'Research', value: 1 },
  { label: 'Writing', value: 2 },
  { label: 'Review', value: 3 },
  { label: 'Other', value: 4 },
] as const;

export const TASK_TYPE_LABELS: Record<number, string> = {
  1: 'Research',
  2: 'Writing',
  3: 'Review',
  4: 'Other',
};
