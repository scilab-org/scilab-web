import * as React from 'react';
import { Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { GapTypeDto } from '@/features/gap-type-management/types';

type GapTypeMultiSelectProps = {
  gapTypes: GapTypeDto[];
  selectedIds: string[];
  onChange: (nextSelectedIds: string[]) => void;
  placeholder?: string;
  listboxId: string;
  inputId?: string;
  className?: string;
};

export const gapTypeTextareaClassName =
  'border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

export const GapTypeMultiSelect = ({
  gapTypes,
  selectedIds,
  onChange,
  placeholder = 'Search gap types...',
  listboxId,
  inputId,
  className,
}: GapTypeMultiSelectProps) => {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const comboboxRef = React.useRef<HTMLDivElement | null>(null);

  const selectedGapTypes = React.useMemo(
    () => gapTypes.filter((gapType) => selectedIds.includes(gapType.id)),
    [gapTypes, selectedIds],
  );

  const filteredGapTypes = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const available = gapTypes.filter(
      (gapType) => !selectedIds.includes(gapType.id),
    );
    if (!query) return available;
    return available.filter((gapType) =>
      gapType.name.toLowerCase().includes(query),
    );
  }, [gapTypes, search, selectedIds]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const addGapType = (gapTypeId: string) => {
    if (selectedIds.includes(gapTypeId)) return;
    onChange([...selectedIds, gapTypeId]);
    setSearch('');
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div ref={comboboxRef} className={cn('relative', className)}>
      <div
        role="combobox"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          'border-input text-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]',
        )}
        onClick={() => inputRef.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
      >
        {selectedGapTypes.map((gapType) => (
          <Badge
            key={gapType.id}
            variant="secondary"
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
          >
            {gapType.name}
            <button
              type="button"
              className="text-white/80 hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(selectedIds.filter((id) => id !== gapType.id));
                setIsOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
              setIsOpen(true);
            }
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
            if (
              e.key === 'Backspace' &&
              !search &&
              selectedGapTypes.length > 0
            ) {
              onChange(selectedIds.slice(0, -1));
              setIsOpen(true);
            }
          }}
          placeholder={
            selectedGapTypes.length > 0 ? 'Add more gap types...' : placeholder
          }
          autoComplete="off"
          className={cn(
            'flex h-5 min-w-24 flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0',
            search.trim() || selectedGapTypes.length > 0
              ? 'placeholder:text-transparent'
              : 'placeholder:text-muted-foreground/50',
          )}
        />
      </div>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="bg-background absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-sm"
        >
          {filteredGapTypes.length > 0 ? (
            filteredGapTypes.map((gapType) => (
              <button
                key={gapType.id}
                type="button"
                className="hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addGapType(gapType.id)}
              >
                <span>{gapType.name}</span>
                <Check className="size-4 opacity-0" />
              </button>
            ))
          ) : (
            <div className="text-muted-foreground px-3 py-2 text-xs">
              No gap types found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
