const SERVICE_PREFIX = '/management-service';

export const AFFILIATION_MANAGEMENT_API = {
  AFFILIATIONS: `${SERVICE_PREFIX}/affiliations`,
  AFFILIATION_BY_ID: (affiliationId: string) =>
    `${SERVICE_PREFIX}/affiliations/${affiliationId}`,
  ADMIN_AFFILIATIONS: `${SERVICE_PREFIX}/admin/affiliations`,
  ADMIN_AFFILIATION_BY_ID: (affiliationId: string) =>
    `${SERVICE_PREFIX}/admin/affiliations/${affiliationId}`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const AFFILIATION_MANAGEMENT_QUERY_KEYS = {
  AFFILIATIONS: 'affiliations',
  AFFILIATION: 'affiliation',
} as const;
