const LAB_SERVICE_PREFIX = '/lab-service';
const AI_SERVICE_PREFIX = '/ai-service';

export const PAPER_MANAGEMENT_API = {
  PAPERS: `${LAB_SERVICE_PREFIX}/papers`,
  PAPER_BY_ID: (paperId: string) => `${LAB_SERVICE_PREFIX}/papers/${paperId}`,
  ADMIN_PAPERS: `${LAB_SERVICE_PREFIX}/admin/papers`,
  ADMIN_PAPER_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/admin/papers/${paperId}`,
  PARSE_PAPER: `${AI_SERVICE_PREFIX}/papers/parse`,
  AUTO_TAG: `${AI_SERVICE_PREFIX}/papers/auto-tag`,
} as const;

export const PAPER_MANAGEMENT_QUERY_KEYS = {
  PAPERS: 'papers',
  PAPER: 'paper',
} as const;

export const PAPER_STATUS_MAP: Record<number, string> = {
  1: 'Draft',
  2: 'Processing',
  3: 'Submitted',
  4: 'Released',
  5: 'Sampled',
};

export const PAPER_STATUS_OPTIONS = [
  { value: 3, label: 'Submitted' },
  { value: 4, label: 'Released' },
  { value: 5, label: 'Sampled' },
];
