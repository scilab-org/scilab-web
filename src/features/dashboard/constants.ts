const SERVICE_PREFIX = '/management-service';

export const DASHBOARD_API = {
  DASHBOARD: `${SERVICE_PREFIX}/admin/dashboard`,
} as const;

export const DASHBOARD_QUERY_KEYS = {
  DASHBOARD: 'dashboard',
} as const;
