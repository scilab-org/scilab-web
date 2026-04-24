import * as React from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';

export const GapTypesFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    name: searchParams.get('name') || '',
  });

  React.useEffect(() => {
    setFilters({
      name: searchParams.get('name') || '',
    });
  }, [searchParams]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (filters.name) params.set('name', filters.name);
    else params.delete('name');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setFilters((prev) => ({ ...prev, name: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('name');
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-wrap items-center gap-2 rounded-md border bg-[#E9E1D8] p-2"
    >
      <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 min-w-50 flex-1 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
        <Search className="text-muted-foreground size-4" />
        <input
          value={filters.name}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Search by gap type name..."
          className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {filters.name && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
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
