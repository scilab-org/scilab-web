import { ClipboardList, Plus, Users } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BTN } from '@/lib/button-styles';
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
            <Icon className="text-primary size-6" />
          </div>
          {badge && (
            <Badge
              variant="outline"
              className={cn(
                'border-transparent',
                badge.variant === 'success' &&
                  'bg-green-500/20 text-green-600 dark:text-green-400',
                badge.variant === 'warning' &&
                  'bg-amber-500/20 text-amber-600 dark:text-amber-400',
                badge.variant === 'info' &&
                  'bg-blue-500/20 text-blue-600 dark:text-blue-400',
              )}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-foreground mt-1 text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
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
    <Badge
      variant="outline"
      className={cn(
        'border-transparent',
        status === 'Completed' &&
          'bg-green-500/20 text-green-600 dark:text-green-400',
        status === 'Processing' &&
          'bg-blue-500/20 text-blue-600 dark:text-blue-400',
        status === 'Pending' &&
          'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      )}
    >
      {status}
    </Badge>
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
      <Card className="mt-4">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-lg">New Semester Setup</CardTitle>
            <CardDescription className="mt-1">
              Prepare the curriculum and student lists for the upcoming term.
            </CardDescription>
          </div>
          <Button className={BTN.CREATE}>
            <Plus className="size-4" />
            Create New Course
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button
            variant="link"
            size="sm"
            className="text-sm text-blue-600 dark:text-blue-400"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.action}
                  </TableCell>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell>
                    <StatusBadge status={activity.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ContentLayout>
  );
};

export default DashboardRoute;
