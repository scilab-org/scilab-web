import { Loader2, Users, FileText, Database, BookOpen } from 'lucide-react';

import { useDatasets } from '@/features/dataset-management/api/get-datasets';
import { cn } from '@/utils/cn';

import { useProjectMembers } from '../../api/members/get-project-members';
import { useProjectPapers } from '../../api/papers/get-project-papers';
import { useSubProjects } from '../../api/papers/get-sub-projects';
import { Project } from '../../types';

const getProjectDomainNames = (project: Project) => {
  const domainNames =
    project.domains?.map((domain) => domain.name).filter(Boolean) ?? [];

  if (domainNames.length > 0) {
    return domainNames.join(', ');
  }

  return project.domain?.trim() || 'Not specified';
};

type ProjectViewProps = {
  project: Project;
};

type ProjectSummaryStatsProps = {
  projectId: string;
};

export const ProjectSummaryStats = ({
  projectId,
}: ProjectSummaryStatsProps) => {
  const membersQuery = useProjectMembers({
    projectId,
    params: { pageNumber: 1, pageSize: 1 },
    queryConfig: { enabled: true, refetchOnMount: 'always' },
  });

  const subProjectsQuery = useSubProjects({
    projectId,
    params: { PageNumber: 1, PageSize: 100 },
    queryConfig: { enabled: true, refetchOnMount: 'always' },
  });

  const referencesQuery = useProjectPapers({
    projectId,
    params: { PageNumber: 1, PageSize: 1 },
    queryConfig: { enabled: true, refetchOnMount: 'always' },
  });

  const datasetsQuery = useDatasets({
    params: { projectId, PageNumber: 1, PageSize: 1 },
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <p className="text-foreground text-3xl font-bold">
            {membersQuery.isLoading ? (
              <Loader2 className="size-6 animate-spin text-[#630F0F]" />
            ) : (
              totalMembers
            )}
          </p>
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
          <p className="text-foreground text-3xl font-bold">
            {subProjectsQuery.isLoading ? (
              <Loader2 className="size-6 animate-spin text-emerald-600" />
            ) : (
              totalPapers
            )}
          </p>
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
          <p className="text-foreground text-3xl font-bold">
            {referencesQuery.isLoading ? (
              <Loader2 className="size-6 animate-spin text-violet-600" />
            ) : (
              totalReferences
            )}
          </p>
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
  );
};

export const ProjectView = ({ project }: ProjectViewProps) => {
  const overviewCards = [
    {
      title: 'Project Context',
      value: project.context || 'Not specified',
    },
    {
      title: 'Key Point',
      value: project.keypoint || 'Not specified',
    },
    {
      title: 'Research Domain',
      value: getProjectDomainNames(project),
    },
  ];

  const projectContextIndex = overviewCards.findIndex(
    (card) => card.title === 'Project Context',
  );
  const keyPointIndex = overviewCards.findIndex(
    (card) => card.title === 'Key Point',
  );
  if (
    projectContextIndex >= 0 &&
    keyPointIndex >= 0 &&
    keyPointIndex < projectContextIndex
  ) {
    const [keyPointCard] = overviewCards.splice(keyPointIndex, 1);
    overviewCards.splice(projectContextIndex + 1, 0, keyPointCard);
  }

  return (
    <div className="grid gap-4">
      {overviewCards.map((card) => {
        const isKeyPoint = card.title === 'Key Point';

        return (
          <div
            key={card.title}
            className="bg-card border-border rounded-md border p-5 shadow-sm transition-colors"
          >
            <div className="mb-3 flex items-center gap-2">
              <p className="text-foreground text-sm font-bold tracking-wider uppercase">
                {card.title}
              </p>
            </div>
            <p
              className={cn(
                'text-foreground w-full text-sm leading-relaxed whitespace-pre-wrap',
                isKeyPoint && 'wrap-break-word whitespace-normal',
              )}
            >
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};
