import { BookOpen, CheckSquare, FolderOpen } from 'lucide-react';

import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card';
import { paths } from '@/config/paths';

import { UserKpis } from '../types';

type UserKpiGridProps = {
  kpis: UserKpis;
};

export const UserKpiGrid = ({ kpis }: UserKpiGridProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <StatCard
      label="My Projects"
      value={kpis.myProjects.total}
      icon={FolderOpen}
      href={paths.app.assignedProjects.list.getHref()}
    />
    <StatCard
      label="My Tasks"
      value={kpis.myTasks.total}
      icon={CheckSquare}
      href={paths.app.myTasks.getHref()}
    />
    <StatCard
      label="My Papers"
      value={kpis.myPapers.total}
      icon={BookOpen}
      href={paths.app.myAssignedPapers.getHref()}
    />
  </div>
);

export const UserKpiGridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-3">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
);
