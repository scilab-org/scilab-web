const SERVICE_PREFIX = '/user-service';

export const GROUP_ROLE_API = {
  GROUPS: `${SERVICE_PREFIX}/groups`,
  GROUP_ROLES: (groupId: string) => `${SERVICE_PREFIX}/groups/${groupId}/roles`,
  REALM_ROLES: `${SERVICE_PREFIX}/roles`,
} as const;

export const GROUP_ROLE_QUERY_KEYS = {
  GROUPS: 'groups',
  GROUP_ROLES: 'group-roles',
  REALM_ROLES: 'realm-roles',
} as const;
