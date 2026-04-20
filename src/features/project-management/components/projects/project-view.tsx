import { Loader2, Users, FileText, Database, BookOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Project, SubProjectPaper } from '../../types';

import { useProjectMembers } from '../../api/members/get-project-members';
import { useProjectPapers } from '../../api/papers/get-project-papers';
import { useSubProjects } from '../../api/papers/get-sub-projects';

import { useDatasets } from '@/features/dataset-management/api/get-datasets';
import { SUBMISSION_STATUS_LABELS } from '@/features/paper-management/constants';

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
    queryConfig: { enabled: true, refetchOnMount: 'always' },
  });

  const subProjectsQuery = useSubProjects({
    projectId: project.id,
    params: { PageNumber: 1, PageSize: 100 },
    queryConfig: { enabled: true, refetchOnMount: 'always' },
  });

  const referencesQuery = useProjectPapers({
    projectId: project.id,
    params: { PageNumber: 1, PageSize: 1 },
    queryConfig: { enabled: true, refetchOnMount: 'always' },
  });

  const datasetsQuery = useDatasets({
    params: { projectId: project.id, PageNumber: 1, PageSize: 1 },
    queryConfig: { enabled: true, refetchOnMount: 'always' },
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

  const subProjectItems: SubProjectPaper[] =
    (subProjectsQuery.data as any)?.result?.items ?? [];
  const summaryItems = Object.entries(
    subProjectItems.reduce<Record<number, number>>((acc, paper) => {
      const s = paper.submissionStatus ?? 1;
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([status, count]) => ({ status: Number(status), count }));

  const overviewCards = [
    {
      title: 'Key Point',
      value: project.keypoint || 'Not specified',
    },
    {
      title: 'Project Context',
      value: project.context || 'Not specified',
    },
    {
      title: 'Research Domain',
      value: project.domain || 'Not specified',
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
              <div className="rounded-md border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
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

              <div className="rounded-md border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
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

              <div className="rounded-md border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
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

              <div className="rounded-md border bg-transparent p-5 shadow-none transition-colors dark:bg-slate-950">
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
              <div className="mt-4 rounded-md border bg-transparent p-4 dark:bg-slate-950">
                <p className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                  Paper Status Breakdown
                </p>
                <div className="flex flex-wrap gap-3">
                  {summaryItems.map(({ status, count }) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 shadow-sm dark:bg-slate-950"
                    >
                      <span className="text-foreground text-sm font-medium">
                        {SUBMISSION_STATUS_LABELS[status] ?? 'Unknown'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1.5 text-xs text-white"
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {overviewCards.map((card) => {
              return (
                <div
                  key={card.title}
                  className="bg-muted/20 rounded-md border p-5 shadow-none transition-colors dark:bg-slate-950"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-foreground text-sm font-bold tracking-wider uppercase">
                      {card.title}
                    </p>
                  </div>
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
