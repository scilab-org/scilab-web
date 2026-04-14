import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, X, SlidersHorizontal } from 'lucide-react';

import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { PAPER_STATUS_OPTIONS } from '../constants';
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
      searchParams.get('status') ||
      searchParams.getAll('author').length > 0,
    );
  });

  const [filters, setFilters] = React.useState({
    title: searchParams.get('title') || '',
    publisher: searchParams.get('publisher') || '',
    abstract: searchParams.get('abstract') || '',
    doi: searchParams.get('doi') || '',
    status: searchParams.get('status') || '',
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

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.title) params.set('title', filters.title);
    if (filters.publisher) params.set('publisher', filters.publisher);
    if (filters.abstract) params.set('abstract', filters.abstract);
    if (filters.doi) params.set('doi', filters.doi);
    if (filters.status) params.set('status', filters.status);
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

  const handleClearAll = () => {
    setFilters({
      title: '',
      publisher: '',
      abstract: '',
      doi: '',
      status: '',
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
        <div className="bg-background flex h-10 min-w-[200px] flex-1 items-center gap-3 rounded-md px-4">
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
        <div className="bg-background flex h-10 w-48 shrink-0 items-center rounded-md px-4">
          <input
            value={filters.doi}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, doi: e.target.value }))
            }
            placeholder="DOI"
            className="text-foreground placeholder:text-muted-foreground/50 w-full bg-transparent font-sans text-sm outline-none"
          />
        </div>

        {/* Keywords */}
        <div className="w-56 shrink-0">
          <TagAutocompleteInput
            tagList={tagList}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            placeholder="Keywords..."
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
        <div className="bg-background space-y-4 rounded-md p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="filter-status"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Status
              </label>
              <FilterDropdown
                value={filters.status}
                onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
                options={PAPER_STATUS_OPTIONS.map((opt) => ({
                  label: opt.label,
                  value: String(opt.value),
                }))}
                placeholder="All status"
                className="h-10 w-full justify-between px-4 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground font-sans text-xs font-medium">
                Authors
              </span>
              <MultiValueInput
                values={authorList}
                onAddValue={handleAddAuthor}
                onRemoveValue={handleRemoveAuthor}
                placeholder="Type an author and press Enter..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="filter-publisher"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Publisher
              </label>
              <Input
                id="filter-publisher"
                value={filters.publisher}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, publisher: e.target.value }))
                }
                placeholder="Search by publisher..."
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="filter-fromDate"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Publication From
              </label>
              <Input
                id="filter-fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="filter-toDate"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Publication To
              </label>
              <Input
                id="filter-toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="filter-paperType"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Paper Type
              </label>
              <Input
                id="filter-paperType"
                value={filters.paperType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, paperType: e.target.value }))
                }
                placeholder="Search by type..."
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="filter-journalName"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Journal Name
              </label>
              <Input
                id="filter-journalName"
                value={filters.journalName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    journalName: e.target.value,
                  }))
                }
                placeholder="Search by journal..."
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="filter-conferenceName"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Conference Name
              </label>
              <Input
                id="filter-conferenceName"
                value={filters.conferenceName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    conferenceName: e.target.value,
                  }))
                }
                placeholder="Search by conference..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="filter-abstract"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Abstract
              </label>
              <Input
                id="filter-abstract"
                value={filters.abstract}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, abstract: e.target.value }))
                }
                placeholder="Search by abstract..."
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="filter-isDeleted"
                className="text-muted-foreground font-sans text-xs font-medium"
              >
                Is Deleted
              </label>
              <FilterDropdown
                value={filters.isDeleted}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, isDeleted: v }))
                }
                options={[
                  { label: 'False', value: 'false' },
                  { label: 'True', value: 'true' },
                ]}
                placeholder="False"
                className="w-full font-sans"
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
