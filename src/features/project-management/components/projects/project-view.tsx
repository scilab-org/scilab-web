import {
  CalendarRange,
  Compass,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Users,
  FileText,
  Database,
  BookOpen,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Project } from '../../types';

import { useProjectMembers } from '../../api/members/get-project-members';
import { useProjectPapers } from '../../api/papers/get-project-papers';
import { useSubProjects } from '../../api/papers/get-sub-projects';
import { useDatasets } from '@/features/dataset-management/api/get-datasets';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';

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
  const membersQuery = useProjectMembers({
    projectId: project.id,
    params: { pageNumber: 1, pageSize: 1 },
    queryConfig: { enabled: true },
  });

  const subProjectsQuery = useSubProjects({
    projectId: project.id,
    params: { PageNumber: 1, PageSize: 100 },
    queryConfig: { enabled: true },
  });

  const referencesQuery = useProjectPapers({
    projectId: project.id,
    params: { PageNumber: 1, PageSize: 1 },
    queryConfig: { enabled: true },
  });

  const datasetsQuery = useDatasets({
    params: { projectId: project.id, PageNumber: 1, PageSize: 1 },
    queryConfig: { enabled: true },
  });

  const totalMembers = Number(
    (membersQuery.data as any)?.result?.paging?.totalCount ?? 0,
  );
  const totalPapers = Number(
    (subProjectsQuery.data as any)?.result?.paging?.totalCount ?? 0,
  );
  const totalReferences = Number(
    (referencesQuery.data as any)?.result?.paging?.totalCount ?? 0,
  );
  const totalDatasets = Number(
    (datasetsQuery.data as any)?.result?.paging?.totalCount ?? 0,
  );

  const papers = (subProjectsQuery.data as any)?.result?.items ?? [];
  const statusCounts = papers.reduce(
    (acc: any, paper: any) => {
      if (paper.status != null) {
        acc[paper.status] = (acc[paper.status] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>,
  );

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

  const overviewCards = [
    {
      title: 'Key Objective',
      value: project.keypoint || 'Not specified',
      description:
        'Main result, hypothesis, or outcome the team is driving toward.',
      icon: Target,
      accent:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40',
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
      title: 'Research Domain',
      value: project.domain || 'Not specified',
      description: 'Primary field and academic focus of the project.',
      icon: Compass,
      accent:
        'bg-[#630F0F]/10 text-[#630F0F] border-[#630F0F]/20 dark:bg-[#630F0F]/20 dark:text-[#630F0F] dark:border-[#630F0F]/40',
    },
  ];

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button
              variant="outlineAction"
              size="action"
              onClick={onUpdate}
              title="Edit"
            >
              EDIT
            </Button>
            <Button
              variant="destructive"
              size="action"
              onClick={onDelete}
              disabled={isDeleting}
              title="Delete"
            >
              {isDeleting ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              DELETE
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card overflow-hidden rounded-md border shadow-sm">
        <div className="p-6">
          <div className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-[#630F0F]/10 p-1.5 text-[#630F0F] dark:bg-[#630F0F]/20 dark:text-[#630F0F]">
                      <Users className="size-4" />
                    </div>
                    <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      Members
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-3xl font-bold">
                      {membersQuery.isLoading ? (
                        <Loader2 className="size-6 animate-spin text-[#630F0F]" />
                      ) : (
                        totalMembers
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-emerald-100/50 p-1.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <BookOpen className="size-4" />
                    </div>
                    <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      Writing Papers
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-3xl font-bold">
                      {subProjectsQuery.isLoading ? (
                        <Loader2 className="size-6 animate-spin text-emerald-600" />
                      ) : (
                        totalPapers
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-violet-100/50 p-1.5 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                      <FileText className="size-4" />
                    </div>
                    <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      References
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-3xl font-bold">
                      {referencesQuery.isLoading ? (
                        <Loader2 className="size-6 animate-spin text-violet-600" />
                      ) : (
                        totalReferences
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-amber-100/50 p-1.5 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      <Database className="size-4" />
                    </div>
                    <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      Datasets
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-3xl font-bold">
                      {datasetsQuery.isLoading ? (
                        <Loader2 className="size-6 animate-spin text-amber-600" />
                      ) : (
                        totalDatasets
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {totalPapers > 0 && (
              <div className="mt-4 rounded-xl border bg-transparent p-4 dark:bg-slate-950">
                <p className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                  Paper Status Breakdown
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 shadow-sm dark:bg-slate-950"
                    >
                      <span className="text-foreground text-sm font-medium">
                        {PAPER_STATUS_MAP[Number(status)] || 'Unknown'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1.5 text-xs"
                      >
                        {String(count)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {overviewCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="bg-muted/20 rounded-xl border p-5 shadow-none transition-colors dark:bg-slate-950"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center rounded-md p-1 ${card.accent.split(' ')[0]} ${card.accent.split(' ')[1]}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      {card.title}
                    </p>
                  </div>
                  {card.description && (
                    <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                      {card.description}
                    </p>
                  )}
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
