import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { BTN } from '@/lib/button-styles';

export const JournalsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
    isDeleted: searchParams.get('isDeleted') || 'false',
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    params.set('isDeleted', filters.isDeleted);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleReset = () => {
    setFilters({ name: '', isDeleted: 'false' });
    setSearchParams({ page: '1' });
  };

  return (
    <form onSubmit={handleFilter} className="bg-muted/40 rounded-xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="filter-journal-name"
            className="text-muted-foreground text-xs font-medium"
          >
            Name
          </label>
          <Input
            id="filter-journal-name"
            placeholder="Search by journal name..."
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="filter-journal-isDeleted"
            className="text-muted-foreground text-xs font-medium"
          >
            Is Deleted
          </label>
          <select
            id="filter-journal-isDeleted"
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

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
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
