const SERVICE_PREFIX = '/lab-service';

export const AUTHOR_ROLE_MANAGEMENT_API = {
  AUTHOR_ROLES: `${SERVICE_PREFIX}/author-roles`,
  AUTHOR_ROLE_BY_ID: (authorRoleId: string) =>
    `${SERVICE_PREFIX}/author-roles/${authorRoleId}`,
  ADMIN_AUTHOR_ROLES: `${SERVICE_PREFIX}/admin/author-roles`,
  ADMIN_AUTHOR_ROLE_BY_ID: (authorRoleId: string) =>
    `${SERVICE_PREFIX}/admin/author-roles/${authorRoleId}`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const AUTHOR_ROLE_MANAGEMENT_QUERY_KEYS = {
  AUTHOR_ROLES: 'authorRoles',
  AUTHOR_ROLE: 'authorRole',
} as const;
