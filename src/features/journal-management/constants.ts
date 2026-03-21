const SERVICE_PREFIX = '/lab-service';

export const JOURNAL_MANAGEMENT_API = {
  JOURNALS: `${SERVICE_PREFIX}/journals`,
  JOURNAL_BY_ID: (journalId: string) =>
    `${SERVICE_PREFIX}/journals/${journalId}`,
  ADMIN_JOURNALS: `${SERVICE_PREFIX}/admin/journals`,
  ADMIN_JOURNAL_BY_ID: (journalId: string) =>
    `${SERVICE_PREFIX}/admin/journals/${journalId}`,
} as const;

export const JOURNAL_MANAGEMENT_QUERY_KEYS = {
  JOURNALS: 'journals',
  JOURNAL: 'journal',
} as const;
