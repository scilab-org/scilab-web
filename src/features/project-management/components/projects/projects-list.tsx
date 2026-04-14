import { useState } from 'react';
import { useSearchParams, Link } from 'react-router';

import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';

import { useProjects } from '../../api/projects/get-projects';
import { getProjectQueryOptions } from '../../api/projects/get-project';
import { useDeleteProject } from '../../api/projects/delete-project';
import { UpdateProject } from './update-project';
import { Project } from '../../types';
import { Pagination } from '@/components/ui/pagination';

export const ProjectsList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] =
    useState<Project | null>(null);

  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const code = searchParams.get('code') || undefined;
  const status = searchParams.get('status') || undefined;
  const isDeleted = searchParams.get('isDeleted') || 'false';

  const projectsQuery = useProjects({
    params: {
      PageNumber: page,
      Name: name,
      Code: code,
      Status: status,
      IsDeleted: isDeleted,
      PageSize: 10,
    },
  });

  const deleteMutation = useDeleteProject({
    mutationConfig: {
      onSuccess: () => {
        // Query will be automatically invalidated
      },
    },
  });

  const handleUpdate = (project: Project) => {
    setSelectedProject(project);
    setUpdateOpen(true);
  };

  const handleDelete = (project: Project) => {
    setPendingDeleteProject(project);
  };

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
          variant: 'draft' as const,
        };
      case 2:
        return {
          text: 'Active',
          variant: 'active' as const,
        };
      case 3:
        return {
          text: 'Completed',
          variant: 'completed' as const,
        };
      case 4:
        return {
          text: 'Archived',
          variant: 'archived' as const,
        };
      default:
        return {
          text: 'Unknown',
          variant: 'outline' as const,
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
        <p className="text-secondary">
          {name || code || status
            ? 'No projects match your search criteria'
            : 'No research projects yet. Get started by creating your first research project.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm">
      <Table>
        <TableHeader className="[&_tr]:bg-surface-container-low [&_tr]:hover:bg-surface-container-low">
          <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
            <TableHead className="text-muted-foreground w-35">Code</TableHead>
            <TableHead className="text-muted-foreground">Name</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Start Date</TableHead>
            <TableHead className="text-muted-foreground">End Date</TableHead>
            <TableHead className="text-muted-foreground text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            return (
              <TableRow key={project.id}>
                <TableCell className="text-foreground text-sm font-medium">
                  {project.code}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    to={paths.app.projectDetail.getHref(project.id)}
                    className="text-foreground font-medium transition-colors"
                    onMouseEnter={() => {
                      queryClient.prefetchQuery(
                        getProjectQueryOptions(project.id),
                      );
                    }}
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.text}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.startDate ? formatDate(project.startDate) : '—'}
                </TableCell>
                <TableCell>
                  {project.endDate ? formatDate(project.endDate) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={paths.app.projectDetail.getHref(project.id)}
                      onMouseEnter={() => {
                        queryClient.prefetchQuery(
                          getProjectQueryOptions(project.id),
                        );
                      }}
                    >
                      <Button variant="action">VIEW</Button>
                    </Link>
                    <Button
                      variant="action"
                      onClick={() => handleUpdate(project)}
                    >
                      EDIT
                    </Button>
                    <Button
                      variant="action"
                      onClick={() => handleDelete(project)}
                    >
                      DELETE
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {paging && <Pagination paging={paging} />}

      <UpdateProject
        project={selectedProject}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />

      <AlertDialog
        open={!!pendingDeleteProject}
        onOpenChange={(open) => !open && setPendingDeleteProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete project{' '}
              <span className="text-primary font-semibold">
                &ldquo;{pendingDeleteProject?.name}&rdquo;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteProject) {
                  deleteMutation.mutate(pendingDeleteProject.id);
                  setPendingDeleteProject(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
