const SERVICE_PREFIX = '/admin';

export const PROJECT_MANAGEMENT_API = {
  PROJECTS: `${SERVICE_PREFIX}/projects`,
  PROJECT_BY_ID: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}`,
} as const;

export const PROJECT_MANAGEMENT_QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECT: 'project',
} as const;
