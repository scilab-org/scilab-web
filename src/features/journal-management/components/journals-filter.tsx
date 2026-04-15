import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';

import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Button } from '@/components/ui/button';

export const JournalsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
    templateCode: searchParams.get('templateCode') || '',
    projectName: searchParams.get('projectName') || '',
    projectCode: searchParams.get('projectCode') || '',
    isDeleted: searchParams.get('isDeleted') || 'false',
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.templateCode) params.set('templateCode', filters.templateCode);
    if (filters.projectName) params.set('projectName', filters.projectName);
    if (filters.projectCode) params.set('projectCode', filters.projectCode);
    params.set('isDeleted', filters.isDeleted);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClear = (field: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [field]: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete(field);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <form
      onSubmit={handleFilter}
      className="flex flex-wrap items-center gap-2 rounded-md border bg-[#E9E1D8] p-2"
    >
      {/* Name */}
      <div className="bg-background flex h-10 min-w-40 flex-1 items-center gap-3 rounded-md px-4 shadow-xs">
        <Search className="text-muted-foreground size-4 shrink-0" />
        <input
          value={filters.name}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Name..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.name && (
          <button
            type="button"
            onClick={() => handleClear('name')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Template Code */}
      <div className="bg-background flex h-10 min-w-36 flex-1 items-center gap-3 rounded-md px-4 shadow-xs">
        <input
          value={filters.templateCode}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, templateCode: e.target.value }))
          }
          placeholder="Structure code..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.templateCode && (
          <button
            type="button"
            onClick={() => handleClear('templateCode')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Project Name */}
      <div className="bg-background flex h-10 min-w-36 flex-1 items-center gap-3 rounded-md px-4 shadow-xs">
        <input
          value={filters.projectName}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, projectName: e.target.value }))
          }
          placeholder="Project name..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.projectName && (
          <button
            type="button"
            onClick={() => handleClear('projectName')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Project Code */}
      <div className="bg-background flex h-10 min-w-32 flex-1 items-center gap-3 rounded-md px-4 shadow-xs">
        <input
          value={filters.projectCode}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, projectCode: e.target.value }))
          }
          placeholder="Project code..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.projectCode && (
          <button
            type="button"
            onClick={() => handleClear('projectCode')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="bg-background h-10 w-28 shrink-0 rounded-md shadow-xs">
        <FilterDropdown
          value={filters.isDeleted}
          onChange={(v) => setFilters((prev) => ({ ...prev, isDeleted: v }))}
          options={[
            { label: 'Active', value: 'false' },
            { label: 'Inactive', value: 'true' },
          ]}
          placeholder="Status"
          className="h-10 w-full justify-between px-4 font-sans"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="outline"
        className="border-input h-10 px-6 font-sans text-sm font-medium"
      >
        Search
      </Button>
    </form>
  );
};
