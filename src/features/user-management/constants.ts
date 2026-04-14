const SERVICE_PREFIX = '/user-service';

export const USER_MANAGEMENT_API = {
  USERS: `${SERVICE_PREFIX}/users`,
  USER_BY_ID: (userId: string) => `${SERVICE_PREFIX}/users/${userId}`,
  DEACTIVATE_USER: (userId: string) =>
    `${SERVICE_PREFIX}/users/${userId}/deactivate`,
  ACTIVATE_USER: (userId: string) =>
    `${SERVICE_PREFIX}/users/${userId}/activate`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-xs font-medium uppercase';

export const USER_MANAGEMENT_QUERY_KEYS = {
  USERS: 'users',
  USER: 'user',
} as const;
