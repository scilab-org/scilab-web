import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BTN } from '@/lib/button-styles';

export const UsersFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    search: searchParams.get('search') || '',
    groupName: searchParams.get('groupName') || '',
    enabled: searchParams.get('enabled') || '',
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.groupName) params.set('groupName', filters.groupName);
    if (filters.enabled) params.set('enabled', filters.enabled);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClear = () => {
    setFilters({
      search: '',
      groupName: '',
      enabled: '',
    });
    setSearchParams({ page: '1' });
  };

  return (
    <form onSubmit={handleApply} className="bg-muted/40 rounded-xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Search Text */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-search"
            className="text-muted-foreground text-xs font-medium"
          >
            Search
          </label>
          <Input
            id="filter-search"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search by name, email..."
          />
        </div>

        {/* Group Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-groupName"
            className="text-muted-foreground text-xs font-medium"
          >
            Group Name
          </label>
          <Input
            id="filter-groupName"
            value={filters.groupName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, groupName: e.target.value }))
            }
            placeholder="Filter by group name..."
          />
        </div>

        {/* Enabled */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-enable"
            className="text-muted-foreground text-xs font-medium"
          >
            Status
          </label>
          <select
            id="filter-enable"
            className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={filters.enabled}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, enabled: e.target.value }))
            }
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground mr-auto"
          >
            <X className="size-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className={BTN.CANCEL}
        >
          Reset
        </Button>
        <Button type="submit" size="sm" className={BTN.EDIT}>
          <Search className="size-4" />
          Search
        </Button>
      </div>
    </form>
  );
};
