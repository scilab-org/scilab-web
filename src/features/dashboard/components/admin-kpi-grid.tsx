import {
  BookOpen,
  FolderOpen,
  LayoutTemplate,
  Library,
  Users,
} from 'lucide-react';

import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card';
import { paths } from '@/config/paths';

import { AdminKpis } from '../types';

type AdminKpiGridProps = {
  kpis: AdminKpis;
};

export const AdminKpiGrid = ({ kpis }: AdminKpiGridProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <StatCard
      label="Projects"
      value={kpis.projects.total}
      icon={FolderOpen}
      href={paths.app.projects.getHref()}
    />
    <StatCard
      label="Paper Bank"
      value={kpis.paperBank.total}
      icon={Library}
      href={paths.app.paperManagement.papers.getHref()}
    />
    <StatCard
      label="Journals & Conferences"
      value={kpis.journals.total}
      icon={BookOpen}
      href={paths.app.journalManagement.journals.getHref()}
    />
    <StatCard
      label="Templates"
      value={kpis.templates.total}
      icon={LayoutTemplate}
      href={paths.app.paperTemplateManagement.paperTemplates.getHref()}
    />
    <StatCard
      label="Users"
      value={kpis.users?.total ?? 0}
      icon={Users}
      href={paths.app.userManagement.users.getHref()}
    />
  </div>
);

export const AdminKpiGridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
);
