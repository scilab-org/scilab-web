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
  { label: 'Completed', value: 3 },
] as const;
