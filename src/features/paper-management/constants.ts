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
  SECTION_GUIDELINE: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/guideline`,
  SECTION_REFERENCE: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/reference`,
  SECTION_HISTORY: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/history`,
  SECTION_UPLOAD_FILE: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/upload-file`,
  SECTION_FILES: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/files`,
  PAPER_SECTIONS_BY_ID: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/sections`,
  COMPILE_LATEX: `${LATEX_SERVICE_PREFIX}/compile`,
  MARK_SECTION: (id: string) =>
    `${LAB_SERVICE_PREFIX}/sections/mark-section/${id}`,
  MARK_SECTION_VERSIONS: (id: string) =>
    `${LAB_SERVICE_PREFIX}/sections/mark-section/${id}/versions`,
  MARK_MAIN_SECTION: (sectionId: string) =>
    `${LAB_SERVICE_PREFIX}/sections/${sectionId}/mark-main-section`,
  PAPER_VERSIONS: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/versions`,
  COMBINE_PAPER: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/versions`,
  COMBINE_VERSION: (paperId: string, versionId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/versions/${versionId}`,
  PAPER_STATUS_HISTORY: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/status-history`,
  PAPER_STATUS_TRANSITION: (paperId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/status-transition`,
  PAPER_VERSION_FILES: (paperId: string, versionId: string) =>
    `${LAB_SERVICE_PREFIX}/papers/${paperId}/versions/${versionId}/files`,
  PAPER_VERSION_FILE_BY_ID: (id: string) =>
    `${LAB_SERVICE_PREFIX}/papers/version-files/${id}`,
} as const;

export const PAPER_MANAGEMENT_QUERY_KEYS = {
  PAPERS: 'papers',
  PAPER: 'paper',
  COMBINE_VERSION: 'combine-version',
  PAPER_VERSIONS: 'paper-versions',
  WRITING_PAPER: 'writing-paper',
  ASSIGNED_SECTIONS: 'paper-assigned-sections',
  ASSIGNED_SECTIONS_HISTORY: 'paper-assigned-sections-history',
  AVAILABLE_SECTION_MEMBERS: 'available-section-members',
  SECTION_MEMBERS: 'section-members',
  PAPER_CONTRIBUTORS: 'paper-contributors',
  PAPER_SECTIONS: 'paper-sections',
  SECTION_FILES: 'section-files',
  SECTION_REFERENCE: 'section-reference',
  MARK_SECTION: 'mark-section',
  SECTION_HISTORY: 'section-history',
  MARK_SECTION_VERSIONS: 'mark-section-versions',
  PAPER_STATUS_HISTORY: 'paper-status-history',
  PAPER_VERSION_FILES: 'paper-version-files',
} as const;

export const SUBMISSION_STATUS_LABELS: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'Revision Required',
  4: 'Resubmitted',
  5: 'Accepted',
  6: 'Published',
  7: 'Rejected',
  8: 'On Hold',
};

export const SUBMISSION_STATUS_TRANSITIONS: Record<number, number[]> = {
  1: [2, 8],
  2: [3, 5, 7, 8],
  3: [4, 8],
  4: [3, 5, 7, 8],
  5: [6, 8],
  6: [],
  7: [],
  8: [1],
};

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
