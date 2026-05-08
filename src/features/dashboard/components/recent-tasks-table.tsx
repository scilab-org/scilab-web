import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';

import { UserRecentTask } from '../types';

const TASK_STATUS: Record<number, string> = {
  1: 'To Do',
  2: 'In Progress',
  3: 'In Review',
  4: 'Completed',
  5: 'Closed',
};

const TASK_TYPE: Record<number, string> = {
  1: 'Research',
  2: 'Writing',
  3: 'Review',
  4: 'Other',
};

type RecentTasksTableProps = {
  tasks: UserRecentTask[];
};

export const RecentTasksTable = ({ tasks }: RecentTasksTableProps) => (
  <Card className="gap-0">
    <CardHeader className="flex-row items-center justify-between border-b px-5 pt-5 pb-4">
      <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
      <Link
        to={paths.app.myTasks.getHref()}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        View more
      </Link>
    </CardHeader>
    <CardContent className="overflow-hidden p-0">
      {tasks.length === 0 ? (
        <p className="text-muted-foreground px-5 py-8 text-center text-xs">
          No tasks yet
        </p>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="w-24 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="align-top font-medium">
                  <span className="line-clamp-2">{task.name}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                    {TASK_TYPE[task.taskType] ?? '—'} · {task.paperTitle}
                  </span>
                </TableCell>
                <TableCell className="w-24 text-right align-top">
                  <Badge variant="outline" className="text-xs">
                    {TASK_STATUS[task.status] ?? '—'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const RecentTasksTableSkeleton = () => (
  <Card className="gap-0">
    <CardHeader className="flex-row items-center justify-between border-b px-5 pt-5 pb-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-16" />
    </CardHeader>
    <CardContent className="p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b px-5 py-3 last:border-0"
        >
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </CardContent>
  </Card>
);
