import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';

import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Button } from '@/components/ui/button';

import { PROJECT_STATUS_OPTIONS } from '../../constants';

export const ProjectsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
    code: searchParams.get('code') || '',
    status: searchParams.get('status') || '',
    isDeleted: searchParams.get('isDeleted') || 'false',
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.code) params.set('code', filters.code);
    if (filters.status) params.set('status', filters.status);
    params.set('isDeleted', filters.isDeleted);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearName = () => {
    setFilters((prev) => ({ ...prev, name: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('name');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearCode = () => {
    setFilters((prev) => ({ ...prev, code: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('code');
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-wrap items-center gap-2 rounded-md border bg-[#E9E1D8] p-2"
    >
      {/* Search Name */}
      <div className="bg-background flex h-10 min-w-[200px] flex-1 items-center gap-3 rounded-md px-4">
        <Search className="text-muted-foreground size-4" />
        <input
          value={filters.name}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Search by name..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.name && (
          <button
            type="button"
            onClick={handleClearName}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Search Code */}
      <div className="bg-background flex h-10 min-w-[200px] flex-1 items-center gap-3 rounded-md px-4">
        <Search className="text-muted-foreground size-4" />
        <input
          value={filters.code}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, code: e.target.value }))
          }
          placeholder="Search by code..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.code && (
          <button
            type="button"
            onClick={handleClearCode}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="bg-background h-10 w-48 rounded-md">
        <FilterDropdown
          value={filters.status}
          onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
          options={PROJECT_STATUS_OPTIONS.map((opt) => ({
            label: opt.label,
            value: String(opt.value),
          }))}
          placeholder="All status"
          className="h-10 w-full justify-between px-4 font-sans"
        />
      </div>

      {/* Is Deleted */}
      <div className="bg-background h-10 w-48 rounded-md">
        <FilterDropdown
          value={filters.isDeleted}
          onChange={(v) => setFilters((prev) => ({ ...prev, isDeleted: v }))}
          options={[
            { label: 'False', value: 'false' },
            { label: 'True', value: 'true' },
          ]}
          placeholder="Is deleted"
          className="h-10 w-full justify-between px-4 font-sans"
        />
      </div>

      {/* Actions */}
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
