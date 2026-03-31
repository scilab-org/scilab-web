import { Pencil, Trash2, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { BTN } from '@/lib/button-styles';
import { Project } from '../../types';

type ProjectViewProps = {
  project: Project;
  onUpdate?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  readOnly?: boolean;
};

export const ProjectView = ({
  project,
  onUpdate,
  onDelete,
  isDeleting = false,
  readOnly = false,
}: ProjectViewProps) => {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getStatusVariant = (
    status: number,
  ): {
    variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
    className?: string;
  } => {
    switch (status) {
      case 1:
        return { variant: 'secondary' };
      case 2:
        return {
          variant: 'default',
          className: 'bg-blue-600 text-white hover:bg-blue-700',
        };
      case 3:
        return {
          variant: 'default',
          className: 'bg-green-600 text-white hover:bg-green-700',
        };
      case 4:
        return {
          variant: 'default',
          className: 'bg-amber-500 text-white hover:bg-amber-600',
        };
      default:
        return { variant: 'outline' };
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdate}
              className={`h-8 w-8 p-0 ${BTN.EDIT_OUTLINE}`}
              title="Edit"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className={`h-8 w-8 p-0 ${BTN.DANGER}`}
              title="Delete"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Project Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground bg-background/60 rounded-md px-3 py-1.5 font-mono text-sm">
                {project.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Information */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Project Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-8">
            <div className="space-y-3 sm:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h3>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                {project.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid gap-x-12 gap-y-8 sm:grid-cols-3">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Domain
                </h3>
                <p className="text-[15px] text-foreground/90">
                  {project.domain || 'Not specified'}
                </p>
              </div>

              <div className="space-y-3 sm:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Context
                </h3>
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  {project.context || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Keypoint
              </h3>
              <p className="text-[15px] leading-relaxed text-foreground/90">
                {project.keypoint || 'Not specified'}
              </p>
            </div>

            <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Research Timeline
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[15px] font-medium text-muted-foreground">
                      Start Date
                    </span>
                    <span className="text-[15px] font-semibold text-foreground">
                      {formatDate(project.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[15px] font-medium text-muted-foreground">
                      End Date
                    </span>
                    <span className="text-[15px] font-semibold text-foreground">
                      {formatDate(project.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Status
                  </h3>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[15px] font-medium text-foreground">
                    Current Status
                  </span>
                  <Badge
                    variant={getStatusVariant(project.status).variant}
                    className={getStatusVariant(project.status).className}
                  >
                    {getStatusText(project.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
