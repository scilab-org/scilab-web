const SERVICE_PREFIX = '/management-service';

export const PROJECT_MANAGEMENT_API = {
  PROJECTS: `${SERVICE_PREFIX}/admin/projects`,
  ADMIN_PROJECT_BY_ID: (projectId: string) =>
    `${SERVICE_PREFIX}/admin/projects/${projectId}`,
  PROJECT_BY_ID: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}`,
} as const;

export const PROJECT_MANAGEMENT_QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECT: 'project',
} as const;

export const PROJECT_STATUS_MAP: Record<number, string> = {
  1: 'Draft',
  2: 'Active',
  3: 'Completed',
  4: 'Archived',
};

export const PROJECT_STATUS_OPTIONS = [
  { value: 1, label: 'Draft' },
  { value: 2, label: 'Active' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Archived' },
];
