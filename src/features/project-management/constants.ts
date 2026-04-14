const SERVICE_PREFIX = '/management-service';

export const PROJECT_MANAGEMENT_API = {
  PROJECTS: `${SERVICE_PREFIX}/admin/projects`,
  ADMIN_PROJECT_BY_ID: (projectId: string) =>
    `${SERVICE_PREFIX}/admin/projects/${projectId}`,
  PROJECT_BY_ID: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}`,
  PROJECT_MEMBERS: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}/members`,
  PROJECT_USERS_AVAILABLE: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}/users/available`,
  // Admin adds managers (requires system:admin group)
  ADD_MANAGERS: (projectId: string) =>
    `${SERVICE_PREFIX}/admin/projects/${projectId}/managers`,
  // Admin removes managers (requires system:admin group)
  REMOVE_MANAGERS: (projectId: string) =>
    `${SERVICE_PREFIX}/admin/projects/${projectId}/managers/remove`,
  // Manager (or admin) removes members from project
  REMOVE_PROJECT_MEMBERS: (projectId: string) =>
    `${SERVICE_PREFIX}/manager/projects/${projectId}/members/remove`,
  // Manager adds members with groupName (requires project:project-manager group)
  ADD_PROJECT_MEMBERS: (projectId: string) =>
    `${SERVICE_PREFIX}/manager/projects/${projectId}/members`,
  // Papers in a project
  PROJECT_PAPERS: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}/papers`,
  // Available papers that can be added to the project
  PROJECT_PAPERS_AVAILABLE: (projectId: string) =>
    `${SERVICE_PREFIX}/manager/projects/${projectId}/papers/available`,
  // Add papers to project
  ADD_PROJECT_PAPERS: (projectId: string) =>
    `${SERVICE_PREFIX}/manager/projects/${projectId}/papers`,
  // Remove papers from project
  REMOVE_PROJECT_PAPERS: (projectId: string) =>
    `${SERVICE_PREFIX}/manager/projects/${projectId}/papers/remove`,
  // Update a member's role in a project
  UPDATE_MEMBER_ROLE: (projectId: string, memberId: string) =>
    `${SERVICE_PREFIX}/manager/projects/${projectId}/members/${memberId}/role`,
  MY_PROJECTS: `${SERVICE_PREFIX}/projects/me`,
  // Current user's role in a project
  MY_ROLE: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}/my-role`,
  // Sub-projects (papers authored within the project)
  SUB_PROJECTS: (projectId: string) =>
    `${SERVICE_PREFIX}/projects/${projectId}/sub-projects`,
  // GET members of a specific sub-project
  PAPER_MEMBERS: (subProjectId: string) =>
    `${SERVICE_PREFIX}/sub-projects/${subProjectId}/members`,
  // GET available members that can be added to a sub-project
  PAPER_MEMBERS_AVAILABLE: (subProjectId: string) =>
    `${SERVICE_PREFIX}/sub-projects/${subProjectId}/members/available`,
  // POST remove members from a sub-project
  REMOVE_PAPER_MEMBERS: (subProjectId: string) =>
    `${SERVICE_PREFIX}/manager/sub-projects/${subProjectId}/members/remove`,
  // POST add members to a sub-project
  ADD_SUB_PROJECT_MEMBERS: (subProjectId: string) =>
    `${SERVICE_PREFIX}/sub-projects/${subProjectId}/members`,
  // DELETE a sub-project
  DELETE_SUB_PROJECT: (subProjectId: string) =>
    `${SERVICE_PREFIX}/manager/sub-projects/${subProjectId}`,
} as const;

export const PROJECT_MANAGEMENT_QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECT: 'project',
  PROJECT_MEMBERS: 'project-members',
  AVAILABLE_USERS: 'available-users',
  PROJECT_PAPERS: 'project-papers',
  AVAILABLE_PAPERS: 'available-papers',
  MY_PROJECTS: 'my-projects',
  MY_ROLE: 'my-role',
  SUB_PROJECTS: 'sub-projects',
  PAPER_MEMBERS: 'paper-members',
  PAPER_MEMBERS_AVAILABLE: 'paper-members-available',
} as const;

export const FIELD_LABEL_CLASS =
  'text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase';

export const PROJECT_STATUS_MAP: Record<number, string> = {
  1: 'Draft',
  2: 'Active',
  3: 'Completed',
  4: 'Archived',
};

export const PROJECT_STATUS_OPTIONS = [
  { value: 1, label: 'Draft' },
  { value: 2, label: 'Active' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Archived' },
];
