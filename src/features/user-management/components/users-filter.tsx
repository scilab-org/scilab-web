import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';

import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Button } from '@/components/ui/button';

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
      className="flex flex-wrap items-center gap-2 rounded-md border bg-[#E9E1D8] p-2"
    >
      {/* Search */}
      <div className="bg-background flex h-10 min-w-[200px] flex-1 items-center gap-3 rounded-md px-4">
        <Search className="text-muted-foreground size-4" />
        <input
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          placeholder="Search users..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Roles */}
      <div className="bg-background h-10 w-56 rounded-md">
        <FilterDropdown
          value={filters.groupName}
          onChange={(v) => handleSelectChange('groupName', v)}
          placeholder="All roles"
          options={[{ label: 'User', value: 'user' }]}
          className="h-10 w-full justify-between px-4 font-sans"
        />
      </div>

      {/* Status */}
      <div className="bg-background h-10 w-56 rounded-md">
        <FilterDropdown
          value={filters.enabled}
          onChange={(v) => handleSelectChange('enabled', v)}
          placeholder="All status"
          options={[
            { label: 'Active', value: 'true' },
            { label: 'Disabled', value: 'false' },
          ]}
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
