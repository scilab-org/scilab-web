import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { BTN } from '@/lib/button-styles';

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

export const ProjectsList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
          variant: 'secondary' as const,
          className: '',
        };
      case 2:
        return {
          text: 'Active',
          variant: 'default' as const,
          className: 'bg-blue-600 text-white hover:bg-blue-700',
        };
      case 3:
        return {
          text: 'Completed',
          variant: 'default' as const,
          className: 'bg-green-600 text-white hover:bg-green-700',
        };
      case 4:
        return {
          text: 'Archived',
          variant: 'default' as const,
          className: 'bg-amber-500 text-white hover:bg-amber-600',
        };
      default:
        return {
          text: 'Unknown',
          variant: 'outline' as const,
          className: '',
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
        <TableHeader>
          <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Name
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Code
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Description
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Status
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              Start Date
            </TableHead>
            <TableHead className="font-semibold text-green-900 dark:text-green-200">
              End Date
            </TableHead>
            <TableHead className="text-right font-semibold text-green-900 dark:text-green-200">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => {
            const statusConfig = getStatusConfig(project.status);
            return (
              <TableRow
                key={project.id}
                className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
              >
                <TableCell className="font-medium">
                  <Link
                    to={paths.app.projectDetail.getHref(project.id)}
                    className="text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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
                  <Badge variant="secondary" className="font-mono text-xs">
                    {project.code}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.description ? (
                    <p className="line-clamp-2 max-w-md text-sm">
                      {project.description}
                    </p>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusConfig.variant}
                    className={statusConfig.className}
                  >
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
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 w-8 p-0 ${BTN.EDIT_OUTLINE}`}
                      onClick={() => handleUpdate(project)}
                      title="Edit Project"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className={`h-8 w-8 p-0 ${BTN.DANGER}`}
                      onClick={() => handleDelete(project)}
                      disabled={deleteMutation.isPending}
                      title="Delete Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {paging && (
        <div className="mt-6 grid grid-cols-3 items-center border-t px-4 pt-4 pb-4">
          <p className="text-muted-foreground text-sm">
            Page{' '}
            <span className="text-foreground font-medium">
              {paging.pageNumber}
            </span>{' '}
            of{' '}
            <span className="text-foreground font-medium">
              {paging.totalPages}
            </span>{' '}
            &middot; {paging.totalCount} results
          </p>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={!paging.hasPreviousPage}
              asChild={paging.hasPreviousPage}
            >
              {paging.hasPreviousPage ? (
                <Link to={buildPageUrl(paging.pageNumber - 1, searchParams)}>
                  <ChevronLeft className="size-4" />
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="size-4" />
                </span>
              )}
            </Button>

            {Array.from({ length: paging.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (paging.totalPages <= 7) return true;
                if (p === 1 || p === paging.totalPages) return true;
                if (Math.abs(p - paging.pageNumber) <= 1) return true;
                return false;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                typeof item === 'string' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="text-muted-foreground px-0.5 text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === paging.pageNumber ? 'default' : 'outline'}
                    size="icon"
                    className={`size-8 text-xs ${item === paging.pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                    asChild={item !== paging.pageNumber}
                  >
                    {item !== paging.pageNumber ? (
                      <Link to={buildPageUrl(item, searchParams)}>{item}</Link>
                    ) : (
                      <span>{item}</span>
                    )}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={!paging.hasNextPage}
              asChild={paging.hasNextPage}
            >
              {paging.hasNextPage ? (
                <Link to={buildPageUrl(paging.pageNumber + 1, searchParams)}>
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span>
                  <ChevronRight className="size-4" />
                </span>
              )}
            </Button>

            <div className="ml-3 flex items-center gap-1.5 border-l pl-3">
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                Go to
              </span>
              <Input
                type="number"
                min={1}
                max={paging.totalPages}
                defaultValue={paging.pageNumber}
                className="h-8 w-14 text-center text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = Number((e.target as HTMLInputElement).value);
                    if (val >= 1 && val <= paging.totalPages) {
                      navigate(buildPageUrl(val, searchParams));
                    }
                  }
                }}
              />
            </div>
          </div>
          <div />
        </div>
      )}

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
              <span className="text-foreground font-semibold">
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
