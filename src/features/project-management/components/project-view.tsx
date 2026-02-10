import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Project } from '../types';

type ProjectViewProps = {
  project: Project;
  onUpdate: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export const ProjectView = ({
  project,
  onUpdate,
  onDelete,
  isDeleting,
}: ProjectViewProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Draft';
      case 2:
        return 'Active';
      case 3:
        return 'Completed';
      case 4:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 2:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 3:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 4:
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="border-border from-muted/50 to-muted/30 rounded-xl border bg-linear-to-br p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium ${getStatusColor(project.status)}`}
              >
                {getStatusText(project.status)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground bg-background/60 rounded-md px-3 py-1.5 font-mono text-sm">
                {project.code}
              </p>
              <span className="text-muted-foreground text-sm">
                Created {formatDate(project.createdOnUtc)} by{' '}
                {project.createdBy || 'System'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdate}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      {/* Project Information */}
      <div className="border-border rounded-xl border shadow-sm">
        <div className="border-border bg-muted/30 border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-semibold">
            Project Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Description
              </dt>
              <dd className="text-foreground bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">
                {project.description || 'No description provided'}
              </dd>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Research Timeline
                </dt>
                <dd className="text-foreground space-y-2">
                  <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                    <span className="text-muted-foreground text-xs font-medium">
                      Start Date
                    </span>
                    <span className="text-sm font-semibold">
                      {formatDate(project.startDate)}
                    </span>
                  </div>
                  <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                    <span className="text-muted-foreground text-xs font-medium">
                      End Date
                    </span>
                    <span className="text-sm font-semibold">
                      {formatDate(project.endDate)}
                    </span>
                  </div>
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Project Status
                </dt>
                <dd className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-medium">
                      {getStatusText(project.status)}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusColor(project.status)}`}
                    >
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
