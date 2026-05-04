import * as React from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const CheckListsFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = React.useState({
    section: searchParams.get('section') || '',
    ruleName: searchParams.get('ruleName') || '',
    item: searchParams.get('item') || '',
    weight: searchParams.get('weight') || '',
  });

  React.useEffect(() => {
    setFilters({
      section: searchParams.get('section') || '',
      ruleName: searchParams.get('ruleName') || '',
      item: searchParams.get('item') || '',
      weight: searchParams.get('weight') || '',
    });
  }, [searchParams]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (filters.section) params.set('section', filters.section);
    else params.delete('section');

    if (filters.ruleName) params.set('ruleName', filters.ruleName);
    else params.delete('ruleName');

    if (filters.item) params.set('item', filters.item);
    else params.delete('item');

    if (filters.weight) params.set('weight', filters.weight);
    else params.delete('weight');

    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearAll = () => {
    setFilters({ section: '', ruleName: '', item: '', weight: '' });
    const params = new URLSearchParams();
    params.set('page', '1');
    setSearchParams(params);
  };

  const hasFilters =
    filters.section || filters.ruleName || filters.item || filters.weight;

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
            value={filters.ruleName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, ruleName: e.target.value }))
            }
            placeholder="Rule Name..."
            className="text-foreground placeholder:text-muted-foreground/50 w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.ruleName && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, ruleName: '' }))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 flex-1 basis-36 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={filters.item}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, item: e.target.value }))
            }
            placeholder="Item..."
            className="text-foreground placeholder:text-muted-foreground/50 w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.item && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, item: '' }))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="bg-background border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 w-28 shrink-0 items-center gap-3 rounded-md border px-4 focus-within:ring-[3px]">
          <Input
            type="number"
            value={filters.weight}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, weight: e.target.value }))
            }
            placeholder="Weight"
            className="border-0 bg-transparent p-0 font-sans text-sm shadow-none focus-visible:ring-0"
            min={0}
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
