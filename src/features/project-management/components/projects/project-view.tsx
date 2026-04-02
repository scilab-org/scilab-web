import {
  CalendarRange,
  Compass,
  Lightbulb,
  Loader2,
  Pencil,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';

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

  const statusVariant = getStatusVariant(project.status);

  const overviewCards = [
    {
      title: 'Research Domain',
      value: project.domain || 'Not specified',
      description: 'Primary field and academic focus of the project.',
      icon: Compass,
      accent:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40',
    },
    {
      title: 'Study Context',
      value: project.context || 'Not specified',
      description: 'Operational setting, environment, and research frame.',
      icon: Sparkles,
      accent:
        'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/40',
    },
    {
      title: 'Key Objective',
      value: project.keypoint || 'Not specified',
      description:
        'Main result, hypothesis, or outcome the team is driving toward.',
      icon: Target,
      accent:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40',
    },
  ];

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
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-b bg-linear-to-r from-slate-50 via-blue-50/60 to-emerald-50/40 px-6 py-5 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-emerald-950/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm dark:bg-blue-700">
                  <Lightbulb className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                    Research Snapshot
                  </p>
                  <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                    {project.name}
                  </h2>
                </div>
              </div>
              <p className="text-foreground/85 max-w-3xl text-sm leading-7 whitespace-pre-wrap">
                {project.description ||
                  'This project does not have a summary yet. Add a concise research description to help collaborators understand the scope quickly.'}
              </p>
            </div>

            <div className="w-full lg:w-[320px]">
              <div className="rounded-xl border border-blue-100 bg-white/90 p-4 shadow-sm dark:border-blue-900/40 dark:bg-slate-950/40">
                <div className="mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <CalendarRange className="size-4" />
                  <span className="text-xs font-semibold tracking-[0.18em] uppercase">
                    Research Timeline
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Start</span>
                    <span className="text-foreground font-semibold">
                      {formatDate(project.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">End</span>
                    <span className="text-foreground font-semibold">
                      {formatDate(project.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_0.85fr]">
            {overviewCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="group rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-950/20"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                        {card.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {card.description}
                      </p>
                    </div>
                    <div className={`rounded-xl border p-2.5 ${card.accent}`}>
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <p className="text-foreground text-sm leading-7 whitespace-pre-wrap">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border bg-linear-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm dark:from-amber-950/20 dark:via-slate-950/20 dark:to-orange-950/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl border border-amber-200 bg-white/80 p-2.5 text-amber-700 shadow-sm dark:border-amber-900/40 dark:bg-slate-950/40 dark:text-amber-300">
                  <Target className="size-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                    Research Direction
                  </p>
                  <h3 className="text-foreground text-base font-semibold">
                    What this project is trying to achieve
                  </h3>
                </div>
              </div>
              <p className="text-foreground/90 text-sm leading-7 whitespace-pre-wrap">
                {project.keypoint ||
                  project.description ||
                  'Define the project objective and intended research outcome to give the team a clear execution target.'}
              </p>
            </div>

            <div className="rounded-2xl border bg-linear-to-br from-slate-50 via-white to-blue-50 p-5 shadow-sm dark:from-slate-900/40 dark:via-slate-950/20 dark:to-blue-950/10">
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                Research Notes
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border bg-white/80 px-4 py-3 dark:bg-slate-950/30">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
                    Project Code
                  </p>
                  <p className="text-foreground mt-1 font-mono text-sm">
                    {project.code}
                  </p>
                </div>
                <div className="rounded-xl border bg-white/80 px-4 py-3 dark:bg-slate-950/30">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
                    Status
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-foreground text-sm font-medium">
                      {getStatusText(project.status)}
                    </span>
                    <Badge
                      variant={statusVariant.variant}
                      className={statusVariant.className}
                    >
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border bg-white/80 px-4 py-3 dark:bg-slate-950/30">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
                    Last Updated
                  </p>
                  <p className="text-foreground mt-1 text-sm font-medium">
                    {formatDate(project.modifiedAt || project.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
