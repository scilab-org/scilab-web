const SERVICE_PREFIX = '';

export const TAG_MANAGEMENT_API = {
  TAGS: `${SERVICE_PREFIX}/tags`,
  TAG_BY_ID: (tagId: string) => `${SERVICE_PREFIX}/tags/${tagId}`,
  ADMIN_TAGS: `${SERVICE_PREFIX}/admin/tags`,
  ADMIN_TAG_BY_ID: (tagId: string) => `${SERVICE_PREFIX}/admin/tags/${tagId}`,
} as const;

export const TAG_MANAGEMENT_QUERY_KEYS = {
  TAGS: 'tags',
  TAG: 'tag',
} as const;
