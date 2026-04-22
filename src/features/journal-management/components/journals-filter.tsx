import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { usePaperTemplates } from '@/features/paper-template-management/api/get-paper-templates';
import { useProjects } from '@/features/project-management/api/projects/get-projects';
import { usePapers } from '@/features/paper-management/api/get-papers';

const JOURNAL_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Journal', value: 'Journal' },
  { label: 'Conference', value: 'Conference' },
];

export const JournalsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [showMore, setShowMore] = React.useState(() =>
    Boolean(
      searchParams.get('templateId') ||
      searchParams.get('projectId') ||
      searchParams.get('paperId') ||
      searchParams.get('isDeleted') === 'true',
    ),
  );

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
    issn: searchParams.get('issn') || '',
    ranking: searchParams.get('ranking') || '',
    type: searchParams.get('type') || '',
    templateId: searchParams.get('templateId') || '',
    projectId: searchParams.get('projectId') || '',
    paperId: searchParams.get('paperId') || '',
    isDeleted: searchParams.get('isDeleted') || 'false',
  });

  const templatesQuery = usePaperTemplates({ params: { PageSize: 1000 } });
  const projectsQuery = useProjects({ params: { PageSize: 1000 } });
  const papersQuery = usePapers({ params: { PageSize: 1000 } });

  const templates = templatesQuery.data?.result?.items ?? [];
  const projects = projectsQuery.data?.result?.items ?? [];
  const papers = papersQuery.data?.result?.items ?? [];

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.issn) params.set('issn', filters.issn);
    if (filters.ranking) params.set('ranking', filters.ranking);
    if (filters.type) params.set('type', filters.type);
    if (filters.templateId) params.set('templateId', filters.templateId);
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.paperId) params.set('paperId', filters.paperId);
    params.set('isDeleted', filters.isDeleted);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearField = (field: keyof typeof filters) => {
    const next = { ...filters, [field]: field === 'isDeleted' ? 'false' : '' };
    setFilters(next);
    const params = new URLSearchParams(searchParams);
    params.delete(field);
    params.set('page', '1');
    setSearchParams(params);
  };

  const secondaryActiveCount = [
    filters.templateId,
    filters.projectId,
    filters.paperId,
    filters.isDeleted !== 'false' ? 'x' : '',
  ].filter(Boolean).length;

  const handleClearAll = () => {
    setFilters({
      name: '',
      issn: '',
      ranking: '',
      type: '',
      templateId: '',
      projectId: '',
      paperId: '',
      isDeleted: 'false',
    });
    setSearchParams({ page: '1' });
  };

  return (
    <form
      onSubmit={handleFilter}
      className="flex flex-col rounded-md border bg-[#E9E1D8] p-2"
    >
      {/* Primary filters */}
      <div className="flex w-full flex-wrap items-center gap-2">
        {/* Name */}
        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 min-w-40 flex-1 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Name..."
            className="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.name && (
            <button
              type="button"
              onClick={() => clearField('name')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* ISSN */}
        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 w-48 shrink-0 items-center gap-2 rounded-md border px-4 focus-within:ring-[3px]">
          <input
            value={filters.issn}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, issn: e.target.value }))
            }
            placeholder="ISSN..."
            className="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.issn && (
            <button
              type="button"
              onClick={() => clearField('issn')}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Ranking */}
        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 w-40 shrink-0 items-center gap-2 rounded-md border px-4 focus-within:ring-[3px]">
          <input
            value={filters.ranking}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, ranking: e.target.value }))
            }
            placeholder="Ranking..."
            className="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.ranking && (
            <button
              type="button"
              onClick={() => clearField('ranking')}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Type */}
        <div className="bg-background h-10 min-w-36 shrink-0 rounded-md shadow-xs">
          <FilterDropdown
            value={filters.type}
            onChange={(v) => setFilters((prev) => ({ ...prev, type: v }))}
            options={JOURNAL_TYPE_OPTIONS}
            placeholder="Type"
            className="h-10 w-full justify-between px-4 font-sans"
          />
        </div>

        {/* More filters toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowMore((prev) => !prev)}
          className="border-input bg-background/50 hover:bg-background relative h-10 w-10 shrink-0"
        >
          <SlidersHorizontal className="size-4" />
          {secondaryActiveCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
              {secondaryActiveCount}
            </span>
          )}
        </Button>

        {/* Submit */}
        <Button
          type="submit"
          variant="outline"
          className="border-input h-10 px-6 font-sans text-sm font-medium"
        >
          Search
        </Button>
      </div>

      {/* Secondary filters - collapsible */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${showMore ? 'mt-2 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="bg-background rounded-md p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Template */}
              <FilterDropdown
                value={filters.templateId}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, templateId: v }))
                }
                options={templates.map((t) => ({
                  label: t.code,
                  value: t.id,
                }))}
                placeholder="Template"
                variant="outline"
                className="h-10 w-full justify-between px-4 font-sans"
              />

              {/* Project */}
              <FilterDropdown
                value={filters.projectId}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, projectId: v }))
                }
                options={projects.map((p) => ({
                  label: `${p.name} (${p.code})`,
                  value: p.id,
                }))}
                placeholder="Project"
                variant="outline"
                className="h-10 w-full justify-between px-4 font-sans"
              />

              {/* Paper */}
              <FilterDropdown
                value={filters.paperId}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, paperId: v }))
                }
                options={papers.map((p) => ({
                  label: p.title || p.id,
                  value: p.id,
                }))}
                placeholder="Paper"
                variant="outline"
                className="h-10 w-full justify-between px-4 font-sans"
              />

              {/* Status */}
              <FilterDropdown
                value={filters.isDeleted}
                onChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    isDeleted: v || 'false',
                  }))
                }
                options={[
                  { label: 'Active', value: 'false' },
                  { label: 'Inactive', value: 'true' },
                ]}
                placeholder="Status"
                variant="outline"
                className="h-10 w-full justify-between px-4 font-sans"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-sans text-xs font-medium"
              >
                <X className="size-4" /> Clear all (
                {secondaryActiveCount +
                  [
                    filters.name,
                    filters.issn,
                    filters.ranking,
                    filters.type,
                  ].filter(Boolean).length}
                )
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
