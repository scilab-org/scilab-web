import { ClipboardList, Plus, Users } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info';
  };
};

const StatCard = ({ title, value, icon: Icon, badge }: StatCardProps) => {
  return (
    <div className="border-border bg-card rounded-xl border p-6">
      <div className="flex items-start justify-between">
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
          <Icon className="text-primary size-6" />
        </div>
        {badge && (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              badge.variant === 'success' &&
                'bg-green-500/20 text-green-600 dark:text-green-400',
              badge.variant === 'warning' &&
                'bg-amber-500/20 text-amber-600 dark:text-amber-400',
              badge.variant === 'info' &&
                'bg-blue-500/20 text-blue-600 dark:text-blue-400',
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="text-foreground mt-1 text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
};

type ActivityItem = {
  id: string;
  action: string;
  user: string;
  date: string;
  status: 'Completed' | 'Processing' | 'Pending';
};

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    action: 'Updated Physics 101 Syllabus',
    user: 'Dr. Sarah Connor',
    date: 'Oct 24, 2023',
    status: 'Completed',
  },
  {
    id: '2',
    action: 'Enrollment Approval (Batch A)',
    user: 'Admin Console',
    date: 'Oct 23, 2023',
    status: 'Processing',
  },
  {
    id: '3',
    action: 'Grade Submission: Math 202',
    user: 'Prof. John Smith',
    date: 'Oct 22, 2023',
    status: 'Pending',
  },
  {
    id: '4',
    action: 'New Student Registration',
    user: 'System',
    date: 'Oct 22, 2023',
    status: 'Completed',
  },
];

const StatusBadge = ({ status }: { status: ActivityItem['status'] }) => {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'Completed' &&
          'bg-green-500/20 text-green-600 dark:text-green-400',
        status === 'Processing' &&
          'bg-blue-500/20 text-blue-600 dark:text-blue-400',
        status === 'Pending' &&
          'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      )}
    >
      {status}
    </span>
  );
};

const DashboardRoute = () => {
  return (
    <ContentLayout
      title="Dashboard Overview"
      description="Welcome back, here's what's happening today."
    >
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value="1,240"
          icon={Users}
          badge={{ text: '↗ +5%', variant: 'success' }}
        />
        <StatCard title="Active Courses" value="34" icon={ClipboardList} />
        <StatCard
          title="Pending Assignments"
          value="128"
          icon={ClipboardList}
          badge={{ text: 'Needs Review', variant: 'warning' }}
        />
      </div>

      {/* New Semester Setup */}
      <div className="border-border bg-card mt-4 rounded-xl border p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              New Semester Setup
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Prepare the curriculum and student lists for the upcoming term.
            </p>
          </div>
          <Button>
            <Plus className="size-4" />
            Create New Course
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-border bg-card mt-4 rounded-xl border">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-semibold">
            Recent Activity
          </h2>
          <button className="text-primary hover:text-primary/80 text-sm">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-left text-sm">
                <th className="px-6 py-3 font-medium">ACTION</th>
                <th className="px-6 py-3 font-medium">USER</th>
                <th className="px-6 py-3 font-medium">DATE</th>
                <th className="px-6 py-3 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="text-sm">
                  <td className="text-foreground px-6 py-4 font-medium">
                    {activity.action}
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    {activity.user}
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    {activity.date}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={activity.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ContentLayout>
  );
};

export default DashboardRoute;
