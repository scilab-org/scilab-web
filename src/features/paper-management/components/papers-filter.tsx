import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X, SlidersHorizontal } from 'lucide-react';

import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Button } from '@/components/ui/button';

import { MultiValueInput } from './multi-value-input';
import { TagAutocompleteInput } from './tag-autocomplete-input';

export const PapersFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMore, setShowMore] = React.useState(() => {
    return Boolean(
      searchParams.get('abstract') ||
      searchParams.get('publisher') ||
      searchParams.get('paperType') ||
      searchParams.get('journalName') ||
      searchParams.get('conferenceName') ||
      searchParams.get('isDeleted') === 'true' ||
      searchParams.get('fromDate') ||
      searchParams.get('toDate') ||
      searchParams.getAll('author').length > 0,
    );
  });

  const [filters, setFilters] = React.useState({
    title: searchParams.get('title') || '',
    publisher: searchParams.get('publisher') || '',
    abstract: searchParams.get('abstract') || '',
    doi: searchParams.get('doi') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    paperType: searchParams.get('paperType') || '',
    journalName: searchParams.get('journalName') || '',
    conferenceName: searchParams.get('conferenceName') || '',
    isDeleted: searchParams.get('isDeleted') || 'false',
  });

  const [authorList, setAuthorList] = React.useState<string[]>(
    searchParams.getAll('author'),
  );

  const [tagList, setTagList] = React.useState<string[]>(
    searchParams.getAll('tag'),
  );
  const [isFromDateFocused, setIsFromDateFocused] = React.useState(false);
  const [isToDateFocused, setIsToDateFocused] = React.useState(false);

  const handleAddAuthor = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !authorList.some(
        (author) => author.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setAuthorList((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveAuthor = (author: string) => {
    setAuthorList((prev) => prev.filter((item) => item !== author));
  };

  const handleAddTag = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !tagList.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setTagList((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
  };

  const activeFilterCount =
    Object.entries(filters).filter(
      ([key, value]) => key !== 'isDeleted' && Boolean(value),
    ).length +
    (authorList.length > 0 ? 1 : 0) +
    (filters.isDeleted !== 'false' ? 1 : 0) +
    (tagList.length > 0 ? 1 : 0);

  const fromDateInputType =
    isFromDateFocused || Boolean(filters.fromDate) ? 'date' : 'text';
  const toDateInputType =
    isToDateFocused || Boolean(filters.toDate) ? 'date' : 'text';

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.title) params.set('title', filters.title);
    if (filters.publisher) params.set('publisher', filters.publisher);
    if (filters.abstract) params.set('abstract', filters.abstract);
    if (filters.doi) params.set('doi', filters.doi);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.paperType) params.set('paperType', filters.paperType);
    if (filters.journalName) params.set('journalName', filters.journalName);
    if (filters.conferenceName)
      params.set('conferenceName', filters.conferenceName);
    authorList.forEach((author) => params.append('author', author));
    tagList.forEach((tag) => params.append('tag', tag));
    params.set('isDeleted', filters.isDeleted);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearTitle = () => {
    setFilters((prev) => ({ ...prev, title: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('title');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearDoi = () => {
    setFilters((prev) => ({ ...prev, doi: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('doi');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClearAll = () => {
    setFilters({
      title: '',
      publisher: '',
      abstract: '',
      doi: '',
      fromDate: '',
      toDate: '',
      paperType: '',
      journalName: '',
      conferenceName: '',
      isDeleted: 'false',
    });
    setAuthorList([]);
    setTagList([]);
    setSearchParams({ page: '1' });
  };

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-col gap-2 rounded-md border bg-[#E9E1D8] p-2"
    >
      <div className="flex w-full flex-wrap items-center gap-2">
        {/* Title */}
        <div className="bg-background flex h-10 min-w-50 flex-1 items-center gap-3 rounded-md px-4 shadow-xs">
          <Search className="text-muted-foreground size-4" />
          <input
            value={filters.title}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Search by title..."
            className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.title && (
            <button
              type="button"
              onClick={handleClearTitle}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* DOI */}
        <div className="bg-background flex h-10 w-48 shrink-0 items-center gap-3 rounded-md px-4 shadow-xs">
          <input
            value={filters.doi}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, doi: e.target.value }))
            }
            placeholder="Search by DOI..."
            className="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent font-sans text-sm outline-none"
          />
          {filters.doi && (
            <button
              type="button"
              onClick={handleClearDoi}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="w-56 shrink-0">
          <TagAutocompleteInput
            tagList={tagList}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            placeholder="Search by tags..."
            className="border-input bg-background focus-within:ring-ring/50 h-10 rounded-md border px-4 py-0 shadow-none focus-within:ring-1"
            inputClassName="text-foreground placeholder:text-muted-foreground/50 font-sans"
          />
        </div>

        {/* More filters toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowMore((prev) => !prev)}
          className="border-input bg-background/50 hover:bg-background h-10 w-10 shrink-0"
        >
          <SlidersHorizontal className="size-4" />
        </Button>

        {/* Submit */}
        <Button
          type="submit"
          variant="outline"
          className="border-input h-10 px-6 font-sans text-sm font-medium"
        >
          Search
        </Button>
      </div>

      {/* Secondary filters - collapsible */}
      {showMore && (
        <div className="bg-background rounded-md p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <MultiValueInput
                values={authorList}
                onAddValue={handleAddAuthor}
                onRemoveValue={handleRemoveAuthor}
                placeholder="Search by author..."
                className="h-10 px-4 py-1"
                inputClassName="text-foreground placeholder:text-muted-foreground/50 font-sans text-sm"
              />
            </div>
            <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
              <input
                value={filters.paperType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, paperType: e.target.value }))
                }
                placeholder="Search by type..."
                className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
              />
              {filters.paperType && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, paperType: '' }))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
                  <input
                    type={fromDateInputType}
                    value={filters.fromDate}
                    onFocus={() => setIsFromDateFocused(true)}
                    onBlur={() => setIsFromDateFocused(false)}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        fromDate: e.target.value,
                      }))
                    }
                    placeholder="From date..."
                    className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
                  />
                  {filters.fromDate && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, fromDate: '' }))
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
                  <input
                    type={toDateInputType}
                    value={filters.toDate}
                    onFocus={() => setIsToDateFocused(true)}
                    onBlur={() => setIsToDateFocused(false)}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        toDate: e.target.value,
                      }))
                    }
                    placeholder="To date..."
                    className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
                  />
                  {filters.toDate && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, toDate: '' }))
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
              <input
                value={filters.publisher}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, publisher: e.target.value }))
                }
                placeholder="Search by publisher..."
                className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
              />
              {filters.publisher && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, publisher: '' }))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
              <input
                value={filters.journalName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    journalName: e.target.value,
                  }))
                }
                placeholder="Search by journal..."
                className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
              />
              {filters.journalName && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, journalName: '' }))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
              <input
                value={filters.conferenceName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    conferenceName: e.target.value,
                  }))
                }
                placeholder="Search by conference..."
                className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
              />
              {filters.conferenceName && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, conferenceName: '' }))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="bg-background border-input flex h-10 items-center gap-3 rounded-md border px-4">
                <input
                  value={filters.abstract}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      abstract: e.target.value,
                    }))
                  }
                  placeholder="Search by abstract..."
                  className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent font-sans text-sm outline-none"
                />
                {filters.abstract && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, abstract: '' }))
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <FilterDropdown
                value={filters.isDeleted}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, isDeleted: v }))
                }
                options={[
                  { label: 'Active', value: 'false' },
                  { label: 'Inactive', value: 'true' },
                ]}
                placeholder="Search by status..."
                variant="outline"
                className="focus:border-outline focus-visible:border-outline h-10 w-full justify-between px-4 font-sans focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-sans text-xs font-medium"
            >
              <X className="size-4" /> Clear all ({activeFilterCount})
            </button>
          </div>
        </div>
      )}
    </form>
  );
};
