const SERVICE_PREFIX = '/management-service';

export const USER_AFFILIATION_MANAGEMENT_API = {
  USER_AFFILIATIONS: `${SERVICE_PREFIX}/admin/user-affiliations`,
  USER_AFFILIATION_BY_ID: (userAffiliationId: string) =>
    `${SERVICE_PREFIX}/admin/user-affiliations/${userAffiliationId}`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const USER_AFFILIATION_MANAGEMENT_QUERY_KEYS = {
  USER_AFFILIATIONS: 'user-affiliations',
} as const;
