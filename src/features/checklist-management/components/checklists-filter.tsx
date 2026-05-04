import * as React from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const CheckListsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    section: searchParams.get('section') || '',
    name: searchParams.get('name') || '',
    weight: searchParams.get('weight') || '',
  });

  React.useEffect(() => {
    setFilters({
      section: searchParams.get('section') || '',
      name: searchParams.get('name') || '',
      weight: searchParams.get('weight') || '',
    });
  }, [searchParams]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (filters.section) params.set('section', filters.section);
    else params.delete('section');

    if (filters.name) params.set('name', filters.name);
    else params.delete('name');

    if (filters.weight) params.set('weight', filters.weight);
    else params.delete('weight');

    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-wrap items-end gap-2 rounded-md border bg-[#E9E1D8] p-2"
    >
      <div
        className="flex flex-wrap gap-2"
        style={{ flex: '1 1 0', minWidth: 0 }}
      >
        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 flex-1 basis-36 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={filters.section}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, section: e.target.value }))
            }
            placeholder="Section..."
            className="text-foreground placeholder:text-muted-foreground/50 w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.section && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, section: '' }))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 flex-1 basis-36 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={filters.name}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Item name..."
            className="text-foreground placeholder:text-muted-foreground/50 w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.name && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, name: '' }))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 w-52 shrink-0 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
          <Input
            type="number"
            value={filters.weight}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || (/^\d+$/.test(val) && Number(val) >= 1)) {
                setFilters((prev) => ({ ...prev, weight: val }));
              }
            }}
            onKeyDown={(e) => {
              if (
                e.key === '-' ||
                e.key === '+' ||
                e.key === 'e' ||
                e.key === '.'
              ) {
                e.preventDefault();
              }
            }}
            placeholder="Weight"
            className="placeholder:text-muted-foreground/50 border-0 bg-transparent p-0 font-sans text-sm shadow-none focus-visible:ring-0"
            min={1}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="outline"
          className="border-input h-10 px-6 font-sans text-sm font-medium"
        >
          Search
        </Button>
      </div>
    </form>
  );
};
