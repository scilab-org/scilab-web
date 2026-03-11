const LAB_SERVICE_PREFIX = '/lab-service';
const AI_SERVICE_PREFIX = '/ai-service';

export const PAPER_MANAGEMENT_API = {
  PAPERS: `${LAB_SERVICE_PREFIX}/papers`,
  PAPER_BY_ID: (paperId: string) => `${LAB_SERVICE_PREFIX}/papers/${paperId}`,
  ADMIN_PAPERS: `${LAB_SERVICE_PREFIX}/admin/papers`,
  ADMIN_PAPER_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/admin/papers/${paperId}`,
  ADMIN_PAPERS_INITIALIZE: `${LAB_SERVICE_PREFIX}/admin/papers/initialize`,
  PARSE_PAPER: `${AI_SERVICE_PREFIX}/papers/parse`,
  AUTO_TAG: `${AI_SERVICE_PREFIX}/papers/auto-tag`,
  ASSIGNED_SECTIONS: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/assigned-sections`,
  PAPER_CONTRIBUTORS: `${LAB_SERVICE_PREFIX}/author/paper-contributors`,
  AVAILABLE_SECTION_MEMBERS: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/paper-contributors/${sectionId}/members/available`,
  SECTION_MEMBERS: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/paper-contributors/${sectionId}/members`,
  PAPER_CONTRIBUTOR_BY_ID: (id: string) =>
    `${LAB_SERVICE_PREFIX}/author/paper-contributors/${id}`,
  PAPER_CONTRIBUTORS_BY_PAPER: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/paper-contributors/papers/${paperId}/contributors`,
  SECTION_BY_ID: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}`,
  PAPER_SECTIONS_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/sections`,
} as const;

export const PAPER_MANAGEMENT_QUERY_KEYS = {
  PAPERS: 'papers',
  PAPER: 'paper',
  ASSIGNED_SECTIONS: 'paper-assigned-sections',
  AVAILABLE_SECTION_MEMBERS: 'available-section-members',
  SECTION_MEMBERS: 'section-members',
  PAPER_CONTRIBUTORS: 'paper-contributors',
  PAPER_SECTIONS: 'paper-sections',
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

export const PAPER_INITIALIZE_STATUS_OPTIONS = [
  { value: 1, label: 'Draft' },
  { value: 2, label: 'Processing' },
];
