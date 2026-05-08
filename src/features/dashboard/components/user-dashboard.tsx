import { UserDashboardResponse, UserKpis } from '../types';
import { DonutChartCard, DonutChartCardSkeleton } from './donut-chart-card';
import { RecentTasksTable, RecentTasksTableSkeleton } from './recent-tasks-table';
import {
  RecentUserPapersTable,
  RecentUserPapersTableSkeleton,
} from './recent-user-papers-table';
import { UserKpiGrid, UserKpiGridSkeleton } from './user-kpi-grid';

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  draft: '#fbbf24',
  completed: '#3b82f6',
  archived: '#9ca3af',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  completed: 'Completed',
  archived: 'Archived',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#9ca3af',
  inProgress: '#3b82f6',
  inReview: '#f59e0b',
  completed: '#22c55e',
  closed: '#6b7280',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  inProgress: 'In Progress',
  inReview: 'In Review',
  completed: 'Completed',
  closed: 'Closed',
};

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

const buildProjectItems = (kpis: UserKpis) =>
  Object.entries(kpis.myProjects.byStatus).map(([key, count]) => ({
    label: PROJECT_STATUS_LABELS[key] ?? key,
    count,
    color: PROJECT_STATUS_COLORS[key] ?? '#9ca3af',
  }));

const buildTaskItems = (kpis: UserKpis) =>
  Object.entries(kpis.myTasks.byStatus).map(([key, count]) => ({
    label: TASK_STATUS_LABELS[key] ?? key,
    count,
    color: TASK_STATUS_COLORS[key] ?? '#9ca3af',
  }));

const buildPaperItems = (kpis: UserKpis) =>
  Object.entries(kpis.myPapers.bySubmissionStatus).map(([key, count]) => ({
    label: SUBMISSION_LABELS[key] ?? key,
    count,
    color: SUBMISSION_COLORS[key] ?? '#9ca3af',
  }));

type UserDashboardProps = {
  data: UserDashboardResponse;
};

export const UserDashboard = ({ data }: UserDashboardProps) => (
  <div className="space-y-6">
    <UserKpiGrid kpis={data.kpis} />

    <div className="grid gap-4 lg:grid-cols-3">
      <DonutChartCard title="Projects" items={buildProjectItems(data.kpis)} />
      <DonutChartCard title="Tasks" items={buildTaskItems(data.kpis)} />
      <DonutChartCard title="Papers" items={buildPaperItems(data.kpis)} />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <RecentTasksTable tasks={data.myRecentTasks} />
      <RecentUserPapersTable papers={data.myRecentPapers} />
    </div>
  </div>
);

export const UserDashboardSkeleton = () => (
  <div className="space-y-6">
    <UserKpiGridSkeleton />
    <div className="grid gap-4 lg:grid-cols-3">
      <DonutChartCardSkeleton />
      <DonutChartCardSkeleton />
      <DonutChartCardSkeleton />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <RecentTasksTableSkeleton />
      <RecentUserPapersTableSkeleton />
    </div>
  </div>
);
