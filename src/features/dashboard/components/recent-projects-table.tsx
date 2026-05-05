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

import { RecentProject } from '../types';

const PROJECT_STATUS: Record<
  number,
  { label: string; variant: 'draft' | 'active' | 'completed' | 'archived' }
> = {
  1: { label: 'Draft', variant: 'draft' },
  2: { label: 'Active', variant: 'active' },
  3: { label: 'Completed', variant: 'completed' },
  4: { label: 'Archived', variant: 'archived' },
};

type RecentProjectsTableProps = {
  projects: RecentProject[];
};

export const RecentProjectsTable = ({ projects }: RecentProjectsTableProps) => (
  <Card className="gap-0">
    <CardHeader className="flex-row items-center justify-between border-b px-5 pt-5 pb-4">
      <CardTitle className="text-sm font-medium">Recent Projects</CardTitle>
      <Link
        to={paths.app.projects.getHref()}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        View more
      </Link>
    </CardHeader>
    <CardContent className="overflow-hidden p-0">
      {projects.length === 0 ? (
        <p className="text-muted-foreground px-5 py-8 text-center text-xs">
          No projects yet
        </p>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-28 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const status = PROJECT_STATUS[project.status];
              return (
                <TableRow key={project.id}>
                  <TableCell className="align-top font-medium">
                    <Link
                      to={paths.app.projectDetail.getHref(project.id)}
                      className="hover:text-primary line-clamp-2 transition-colors"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="w-28 align-top text-right">
                    <Badge variant={status?.variant ?? 'outline'}>
                      {status?.label ?? project.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const RecentProjectsTableSkeleton = () => (
  <Card className="gap-0">
    <CardHeader className="border-b px-5 pt-5 pb-4">
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-5 w-16 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
