import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import { FilterSelect } from '@/components/ui/filter-select';

export const UsersFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    search: searchParams.get('search') || '',
    groupName: searchParams.get('groupName') || '',
    enabled: searchParams.get('enabled') || '',
  });

  const applyFilters = (next: typeof filters) => {
    const params = new URLSearchParams();
    if (next.search) params.set('search', next.search);
    if (next.groupName) params.set('groupName', next.groupName);
    if (next.enabled) params.set('enabled', next.enabled);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(filters);
  };

  const handleSelectChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    applyFilters(next);
  };

  const handleClearSearch = () => {
    const next = { ...filters, search: '' };
    setFilters(next);
    applyFilters(next);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background flex h-11 items-stretch overflow-hidden rounded-xl border"
    >
      {/* Search */}
      <div className="flex flex-1 items-center gap-3 px-4">
        <Search className="text-muted-foreground size-3.5 shrink-0" />
        <input
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          placeholder="Search protocol database..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-mono text-[11px] tracking-widest uppercase outline-none"
        />
        {filters.search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="border-l" />

      {/* Roles */}
      <FilterSelect
        value={filters.groupName}
        onChange={(v) => handleSelectChange('groupName', v)}
      >
        <option value="">Roles</option>
        <option value="user">User</option>
      </FilterSelect>

      <div className="border-l" />

      {/* Status */}
      <FilterSelect
        value={filters.enabled}
        onChange={(v) => handleSelectChange('enabled', v)}
      >
        <option value="">Status</option>
        <option value="true">Active</option>
        <option value="false">Disabled</option>
      </FilterSelect>

      <div className="border-l" />

      {/* Submit */}
      <button
        type="submit"
        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center px-4 transition-colors"
      >
        <SlidersHorizontal className="size-4" />
      </button>
    </form>
  );
};
