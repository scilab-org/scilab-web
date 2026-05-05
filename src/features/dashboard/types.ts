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

export type UserDashboardResponse = {
  role: 'user';
};

export type DashboardResponse = AdminDashboardResponse | UserDashboardResponse;
