import * as React from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BTN } from '@/lib/button-styles';

export const PaperTemplatesFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
    code: searchParams.get('code') || '',
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.code) params.set('code', filters.code);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClear = () => {
    setFilters({ name: '', code: '' });
    setSearchParams({ page: '1' });
  };

  return (
    <form onSubmit={handleApply} className="bg-muted/40 rounded-xl border p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="filter-pt-name"
            className="text-muted-foreground text-xs font-medium"
          >
            Name
          </label>
          <Input
            id="filter-pt-name"
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Search by name..."
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="filter-pt-code"
            className="text-muted-foreground text-xs font-medium"
          >
            Code
          </label>
          <Input
            id="filter-pt-code"
            value={filters.code}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="Search by code..."
          />
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
