const SERVICE_PREFIX = '/management-service';

export const DASHBOARD_API = {
  ADMIN_DASHBOARD: `${SERVICE_PREFIX}/admin/dashboard`,
  USER_DASHBOARD: `${SERVICE_PREFIX}/user/dashboard`,
} as const;

export const DASHBOARD_QUERY_KEYS = {
  DASHBOARD: 'dashboard',
} as const;
