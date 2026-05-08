// ── Admin KPI types ───────────────────────────────────────────────────────────

export type AdminProjectKpis = {
  total: number;
  byStatus: {
    draft: number;
    active: number;
    completed: number;
    archived: number;
  };
};

export type AdminSubmissionStatusKpis = {
  counts: Record<string, number>;
};

export type AdminPaperBankKpis = {
  total: number;
};

export type AdminJournalKpis = {
  total: number;
  journalCount: number;
  conferenceCount: number;
};

export type AdminTemplateKpis = {
  total: number;
};

export type AdminUserKpis = {
  total: number;
};

export type AdminKpis = {
  projects: AdminProjectKpis;
  submissionStatus: AdminSubmissionStatusKpis;
  paperBank: AdminPaperBankKpis;
  journals: AdminJournalKpis;
  templates: AdminTemplateKpis;
  users?: AdminUserKpis;
};

// ── Recent item types ─────────────────────────────────────────────────────────

export type RecentProject = {
  id: string;
  name: string;
  code: string;
  status: number;
  createdAt: string;
};

export type RecentPaper = {
  id: string;
  projectId: string;
  title: string;
  status: number | null;
  conferenceJournalName: string | null;
  createdAt: string;
};

// ── Dashboard response ────────────────────────────────────────────────────────

export type AdminDashboardResponse = {
  role: 'admin';
  kpis: AdminKpis;
  recentProjects: RecentProject[];
  recentPapers: RecentPaper[];
};

// ── User KPI types ────────────────────────────────────────────────────────────

export type UserProjectKpis = {
  total: number;
  active: number;
  byStatus: Record<string, number>;
};

export type UserTaskKpis = {
  total: number;
  byStatus: {
    todo: number;
    inProgress: number;
    inReview: number;
    completed: number;
    closed: number;
  };
};

export type UserPaperKpis = {
  total: number;
  bySubmissionStatus: Record<string, number>;
};

export type UserKpis = {
  myProjects: UserProjectKpis;
  myTasks: UserTaskKpis;
  myPapers: UserPaperKpis;
};

export type UserRecentTask = {
  id: string;
  name: string;
  taskType: number;
  status: number;
  paperId: string;
  paperTitle: string;
  nextReviewDate: string | null;
  lastModifiedAt: string;
};

export type UserRecentPaper = {
  id: string;
  projectId: string | null;
  title: string;
  paperStatus: number | null;
  submissionStatus: number | null;
  conferenceJournalName: string | null;
  conferenceJournalEndAt: string | null;
  lastModifiedAt: string;
};

export type UserDashboardResponse = {
  role: 'user';
  kpis: UserKpis;
  myRecentTasks: UserRecentTask[];
  myRecentPapers: UserRecentPaper[];
};

export type DashboardResponse = AdminDashboardResponse | UserDashboardResponse;
