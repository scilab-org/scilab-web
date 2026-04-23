const SERVICE_PREFIX = '/lab-service';

export const GAP_TYPE_MANAGEMENT_API = {
  GAP_TYPES: `${SERVICE_PREFIX}/gap-types`,
  GAP_TYPE_BY_ID: (gapTypeId: string) =>
    `${SERVICE_PREFIX}/gap-types/${gapTypeId}`,
  ADMIN_GAP_TYPES: `${SERVICE_PREFIX}/admin/gap-types`,
  ADMIN_GAP_TYPE_BY_ID: (gapTypeId: string) =>
    `${SERVICE_PREFIX}/admin/gap-types/${gapTypeId}`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const GAP_TYPE_MANAGEMENT_QUERY_KEYS = {
  GAP_TYPES: 'gap-types',
  GAP_TYPE: 'gap-type',
} as const;
