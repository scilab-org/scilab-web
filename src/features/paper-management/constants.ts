const LAB_SERVICE_PREFIX = '/lab-service';
const AI_SERVICE_PREFIX = '/ai-service';
const LATEX_SERVICE_PREFIX = '/latex-service';

export const PAPER_MANAGEMENT_API = {
  PAPERS: `${LAB_SERVICE_PREFIX}/paper-bank`,
  PAPER_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/paper-bank/${paperId}`,
  ADMIN_PAPERS: `${LAB_SERVICE_PREFIX}/admin/paper-bank`,
  ADMIN_PAPER_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/admin/paper-bank/${paperId}`,
  ADMIN_PAPERS_INITIALIZE: `${LAB_SERVICE_PREFIX}/papers`,
  WRITING_PAPER_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}`,
  PARSE_PAPER: `${AI_SERVICE_PREFIX}/papers/parse`,
  AUTO_TAG: `${AI_SERVICE_PREFIX}/papers/auto-tag`,
  ASSIGNED_SECTIONS: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/assigned-sections`,
  ASSIGNED_SECTIONS_HISTORY: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/assigned-sections/history`,
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
  SECTION_UPLOAD_FILE: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/upload-file`,
  SECTION_FILES: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/files`,
  PAPER_SECTIONS_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/sections`,
  COMPILE_LATEX: `${LATEX_SERVICE_PREFIX}/compile`,
  MARK_SECTION: (id: string) =>
    `${LAB_SERVICE_PREFIX}/sections/mark-section/${id}`,
  MARK_MAIN_SECTION: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/mark-main-section`,
} as const;

export const PAPER_MANAGEMENT_QUERY_KEYS = {
  PAPERS: 'papers',
  PAPER: 'paper',
  WRITING_PAPER: 'writing-paper',
  ASSIGNED_SECTIONS: 'paper-assigned-sections',
  ASSIGNED_SECTIONS_HISTORY: 'paper-assigned-sections-history',
  AVAILABLE_SECTION_MEMBERS: 'available-section-members',
  SECTION_MEMBERS: 'section-members',
  PAPER_CONTRIBUTORS: 'paper-contributors',
  PAPER_SECTIONS: 'paper-sections',
  SECTION_FILES: 'section-files',
  MARK_SECTION: 'mark-section',
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

export const COMMENT_API = {
  SECTION_COMMENTS: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/comments/section/${sectionId}`,
  COMMENTS: `${LAB_SERVICE_PREFIX}/comments`,
  COMMENT_BY_ID: (id: string) => `${LAB_SERVICE_PREFIX}/comments/${id}`,
} as const;

export const COMMENT_QUERY_KEYS = {
  SECTION_COMMENTS: 'section-comments',
} as const;
