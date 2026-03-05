import * as React from 'react';
import { useSearchParams } from 'react-router';
import { Search, ChevronDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { BTN } from '@/lib/button-styles';
import { PAPER_STATUS_OPTIONS } from '../constants';
import { TagAutocompleteInput } from './tag-autocomplete-input';

export const PapersFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMore, setShowMore] = React.useState(() => {
    return Boolean(
      searchParams.get('abstract') ||
      searchParams.get('doi') ||
      searchParams.get('paperType') ||
      searchParams.get('journalName') ||
      searchParams.get('conferenceName') ||
      searchParams.get('isDeleted') === 'true',
    );
  });

  const [filters, setFilters] = React.useState({
    title: searchParams.get('title') || '',
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

  const [tagList, setTagList] = React.useState<string[]>(
    searchParams.getAll('tag'),
  );

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
    (filters.isDeleted !== 'false' ? 1 : 0) +
    (tagList.length > 0 ? 1 : 0);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.title) params.set('title', filters.title);
    if (filters.abstract) params.set('abstract', filters.abstract);
    if (filters.doi) params.set('doi', filters.doi);
    if (filters.status) params.set('status', filters.status);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.paperType) params.set('paperType', filters.paperType);
    if (filters.journalName) params.set('journalName', filters.journalName);
    if (filters.conferenceName)
      params.set('conferenceName', filters.conferenceName);
    tagList.forEach((tag) => params.append('tag', tag));
    params.set('isDeleted', filters.isDeleted);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleClear = () => {
    setFilters({
      title: '',
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
    setTagList([]);
    setSearchParams({ page: '1' });
  };

  return (
    <form onSubmit={handleApply} className="bg-muted/40 rounded-xl border p-6">
      {/* Primary filters - always visible */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Title - wider */}
        <div className="space-y-1.5 lg:col-span-2">
          <label
            htmlFor="filter-title"
            className="text-muted-foreground text-xs font-medium"
          >
            Title
          </label>
          <Input
            id="filter-title"
            value={filters.title}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Search by title..."
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
            {PAPER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-fromDate"
            className="text-muted-foreground text-xs font-medium"
          >
            Publication From
          </label>
          <Input
            id="filter-fromDate"
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                fromDate: e.target.value,
              }))
            }
          />
        </div>

        {/* To Date */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-toDate"
            className="text-muted-foreground text-xs font-medium"
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

        {/* Tags */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <span className="text-muted-foreground text-xs font-medium">
            Tags
          </span>
          <TagAutocompleteInput
            tagList={tagList}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            placeholder="Type a tag and press Enter..."
          />
        </div>
      </div>

      {/* More filters toggle */}
      <button
        type="button"
        onClick={() => setShowMore((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1 text-xs font-medium transition-colors"
      >
        <ChevronDown
          className={`size-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`}
        />
        {showMore ? 'Less filters' : 'More filters'}
      </button>

      {/* Secondary filters - collapsible */}
      {showMore && (
        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* DOI */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-doi"
              className="text-muted-foreground text-xs font-medium"
            >
              DOI
            </label>
            <Input
              id="filter-doi"
              value={filters.doi}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, doi: e.target.value }))
              }
              placeholder="Search by DOI..."
            />
          </div>

          {/* Paper Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-paperType"
              className="text-muted-foreground text-xs font-medium"
            >
              Paper Type
            </label>
            <Input
              id="filter-paperType"
              value={filters.paperType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  paperType: e.target.value,
                }))
              }
              placeholder="Search by type..."
            />
          </div>

          {/* Journal Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-journalName"
              className="text-muted-foreground text-xs font-medium"
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

          {/* Conference Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-conferenceName"
              className="text-muted-foreground text-xs font-medium"
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

          {/* Abstract */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-abstract"
              className="text-muted-foreground text-xs font-medium"
            >
              Abstract
            </label>
            <Input
              id="filter-abstract"
              value={filters.abstract}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  abstract: e.target.value,
                }))
              }
              placeholder="Search by abstract..."
            />
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
                setFilters((prev) => ({
                  ...prev,
                  isDeleted: e.target.value,
                }))
              }
            >
              <option value="false">False</option>
              <option value="true">True</option>
            </select>
          </div>
        </div>
      )}

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
