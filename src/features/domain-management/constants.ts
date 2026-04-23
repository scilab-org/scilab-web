const SERVICE_PREFIX = '/management-service';

export const DOMAIN_MANAGEMENT_API = {
  DOMAINS: `${SERVICE_PREFIX}/domains`,
  DOMAIN_BY_ID: (domainId: string) => `${SERVICE_PREFIX}/domains/${domainId}`,
  ADMIN_DOMAINS: `${SERVICE_PREFIX}/admin/domains`,
  ADMIN_DOMAIN_BY_ID: (domainId: string) =>
    `${SERVICE_PREFIX}/admin/domains/${domainId}`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const DOMAIN_MANAGEMENT_QUERY_KEYS = {
  DOMAINS: 'domains',
  DOMAIN: 'domain',
} as const;
