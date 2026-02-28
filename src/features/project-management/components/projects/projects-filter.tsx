import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { PROJECT_STATUS_OPTIONS } from '../../constants';

export const ProjectsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
    code: searchParams.get('code') || '',
    status: searchParams.get('status') || '',
    isDeleted: searchParams.get('isDeleted') || 'false',
  });

  const activeFilterCount =
    Object.entries(filters).filter(
      ([key, value]) => key !== 'isDeleted' && Boolean(value),
    ).length + (filters.isDeleted !== 'false' ? 1 : 0);

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

  const handleClear = () => {
    setFilters({
      name: '',
      code: '',
      status: '',
      isDeleted: 'false',
    });
    setSearchParams({ page: '1' });
  };

  return (
    <form onSubmit={handleApply} className="bg-muted/40 rounded-xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-name"
            className="text-muted-foreground text-xs font-medium"
          >
            Name
          </label>
          <Input
            id="filter-name"
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Search by name..."
          />
        </div>

        {/* Code */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-code"
            className="text-muted-foreground text-xs font-medium"
          >
            Code
          </label>
          <Input
            id="filter-code"
            value={filters.code}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="Search by code..."
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-status"
            className="text-muted-foreground text-xs font-medium"
          >
            Status
          </label>
          <select
            id="filter-status"
            className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All</option>
            {PROJECT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Is Deleted */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-isDeleted"
            className="text-muted-foreground text-xs font-medium"
          >
            Is Deleted
          </label>
          <select
            id="filter-isDeleted"
            className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={filters.isDeleted}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, isDeleted: e.target.value }))
            }
          >
            <option value="false">False</option>
            <option value="true">True</option>
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
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          Reset
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Search className="size-4" />
          Search
        </Button>
      </div>
    </form>
  );
};
