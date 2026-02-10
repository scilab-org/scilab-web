import { useSearchParams, Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

import { useProjects } from '../api/get-projects';

export const ProjectsList = () => {
  const [searchParams] = useSearchParams();

  const page = +(searchParams.get('page') || 1);
  const searchText = searchParams.get('search') || undefined;
  const pageSize = +(searchParams.get('pageSize') || 10);

  const projectsQuery = useProjects({
    params: { pageNumber: page, searchText, pageSize },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return {
          text: 'Draft',
          variant: 'secondary' as const,
        };
      case 2:
        return {
          text: 'Active',
          variant: 'default' as const,
        };
      case 3:
        return {
          text: 'Completed',
          variant: 'outline' as const,
        };
      case 4:
        return {
          text: 'Archived',
          variant: 'destructive' as const,
        };
      default:
        return {
          text: 'Unknown',
          variant: 'secondary' as const,
        };
    }
  };

  if (projectsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const projects = projectsQuery.data?.result?.items;
  const paging = projectsQuery.data?.result?.paging;

  if (!projects || projects.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">
          {searchText
            ? 'No projects match your search criteria'
            : 'No research projects yet. Get started by creating your first research project.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link
                    to={paths.app.projectDetail.getHref(project.id)}
                    className="text-primary hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <code className="text-muted-foreground text-xs">
                    {project.code}
                  </code>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-2 max-w-md text-sm">
                    {project.description || 'No description'}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.text}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(project.startDate)}</TableCell>
                <TableCell>{formatDate(project.endDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="xs" asChild>
                      <Link to={paths.app.projectDetail.getHref(project.id)}>
                        View
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {paging && paging.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {paging.pageNumber} of {paging.totalPages} ({paging.totalCount}{' '}
            total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!paging.hasPreviousPage}
              asChild={paging.hasPreviousPage}
            >
              {paging.hasPreviousPage ? (
                <Link
                  to={`?page=${paging.pageNumber - 1}${searchText ? `&search=${searchText}` : ''}${pageSize !== 10 ? `&pageSize=${pageSize}` : ''}`}
                >
                  Previous
                </Link>
              ) : (
                'Previous'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!paging.hasNextPage}
              asChild={paging.hasNextPage}
            >
              {paging.hasNextPage ? (
                <Link
                  to={`?page=${paging.pageNumber + 1}${searchText ? `&search=${searchText}` : ''}${pageSize !== 10 ? `&pageSize=${pageSize}` : ''}`}
                >
                  Next
                </Link>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
