const SERVICE_PREFIX = '/lab-service';

export const PAPER_MANAGEMENT_API = {
  PAPERS: `${SERVICE_PREFIX}/papers`,
  PAPER_BY_ID: (paperId: string) => `${SERVICE_PREFIX}/papers/${paperId}`,
  ADMIN_PAPERS: `${SERVICE_PREFIX}/admin/papers`,
  ADMIN_PAPER_BY_ID: (paperId: string) =>
    `${SERVICE_PREFIX}/admin/papers/${paperId}`,
  ADMIN_PAPERS_INITIALIZE: `${SERVICE_PREFIX}/admin/papers/initialize`,
  PARSE_PAPER: `${SERVICE_PREFIX}/papers/parse`,
  AUTO_TAG: `${SERVICE_PREFIX}/papers/auto-tag`,
} as const;

export const PAPER_MANAGEMENT_QUERY_KEYS = {
  PAPERS: 'papers',
  PAPER: 'paper',
} as const;

export const PAPER_STATUS_MAP: Record<number, string> = {
  1: 'Draft',
  2: 'Processing',
  3: 'Submited',
  4: 'Released',
  5: 'Sampled',
};

export const PAPER_STATUS_OPTIONS = [
  { value: 3, label: 'Submited' },
  { value: 4, label: 'Released' },
  { value: 5, label: 'Sampled' },
];

export const PAPER_INITIALIZE_STATUS_OPTIONS = [
  { value: 1, label: 'Draft' },
  { value: 2, label: 'Processing' },
];
