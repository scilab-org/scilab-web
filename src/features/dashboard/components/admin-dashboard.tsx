import { AlertCircle } from 'lucide-react';

import { AdminDashboardResponse, AdminKpis } from '../types';
import { AdminKpiGrid, AdminKpiGridSkeleton } from './admin-kpi-grid';
import { DonutChartCard, DonutChartCardSkeleton } from './donut-chart-card';
import {
  RecentProjectsTable,
  RecentProjectsTableSkeleton,
} from './recent-projects-table';
import {
  RecentPapersTable,
  RecentPapersTableSkeleton,
} from './recent-papers-table';

const buildProjectItems = (kpis: AdminKpis) => [
  {
    label: 'Active',
    count: kpis.projects.byStatus.active ?? 0,
    color: '#22c55e',
  },
  {
    label: 'Draft',
    count: kpis.projects.byStatus.draft ?? 0,
    color: '#fbbf24',
  },
  {
    label: 'Completed',
    count: kpis.projects.byStatus.completed ?? 0,
    color: '#3b82f6',
  },
  {
    label: 'Archived',
    count: kpis.projects.byStatus.archived ?? 0,
    color: '#9ca3af',
  },
];

const SUBMISSION_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  submitted: '#3b82f6',
  revisionRequired: '#f59e0b',
  resubmitted: '#0ea5e9',
  accepted: '#22c55e',
  published: '#059669',
  rejected: '#ef4444',
  onHold: '#fb923c',
};

const SUBMISSION_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  revisionRequired: 'Revision Required',
  resubmitted: 'Resubmitted',
  accepted: 'Accepted',
  published: 'Published',
  rejected: 'Rejected',
  onHold: 'On Hold',
};

const buildSubmissionItems = (kpis: AdminKpis) =>
  Object.entries(kpis.submissionStatus.counts).map(([key, count]) => ({
    label: SUBMISSION_LABELS[key] ?? key,
    count,
    color: SUBMISSION_COLORS[key] ?? '#9ca3af',
  }));

type AdminDashboardProps = {
  data: AdminDashboardResponse;
};

export const AdminDashboard = ({ data }: AdminDashboardProps) => (
  <div className="space-y-6">
    <AdminKpiGrid kpis={data.kpis} />

    <div className="grid gap-4 lg:grid-cols-2">
      <DonutChartCard title="Projects" items={buildProjectItems(data.kpis)} />
      <DonutChartCard title="Papers" items={buildSubmissionItems(data.kpis)} />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <RecentProjectsTable projects={data.recentProjects} />
      <RecentPapersTable papers={data.recentPapers} />
    </div>
  </div>
);

export const AdminDashboardSkeleton = () => (
  <div className="space-y-6">
    <AdminKpiGridSkeleton />
    <div className="grid gap-4 lg:grid-cols-2">
      <DonutChartCardSkeleton />
      <DonutChartCardSkeleton />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <RecentProjectsTableSkeleton />
      <RecentPapersTableSkeleton />
    </div>
  </div>
);

export const AdminDashboardError = () => (
  <div className="border-border flex items-center gap-3 rounded-lg border p-5">
    <AlertCircle className="text-destructive size-5 shrink-0" />
    <p className="text-muted-foreground text-sm">
      Failed to load dashboard data. Please refresh the page.
    </p>
  </div>
);
