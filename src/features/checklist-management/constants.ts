const SERVICE_PREFIX = '/lab-service';

export const CHECKLIST_MANAGEMENT_API = {
  CHECK_LISTS: `${SERVICE_PREFIX}/check-lists`,
  CHECK_LIST_BY_ID: (checkListId: string) =>
    `${SERVICE_PREFIX}/check-lists/${checkListId}`,
  ADMIN_CHECK_LISTS: `${SERVICE_PREFIX}/admin/check-lists`,
  ADMIN_CHECK_LIST_BY_ID: (checkListId: string) =>
    `${SERVICE_PREFIX}/admin/check-lists/${checkListId}`,
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const CHECKLIST_MANAGEMENT_QUERY_KEYS = {
  CHECK_LISTS: 'check-lists',
  CHECK_LIST: 'check-list',
} as const;
