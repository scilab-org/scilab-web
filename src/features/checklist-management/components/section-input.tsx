import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';

import { cn } from '@/utils/cn';

export const SECTION_SUGGESTIONS = [
  'Abstract',
  'Keywords',
  'Introduction',
  'Literature Review',
  'Related Work',
  'Theoretical Framework',
  'Research Methodology',
  'Data Collection',
  'Data Analysis',
  'Statistical Analysis',
  'Results',
  'Findings',
  'Discussion',
  'Conclusion',
  'Recommendations',
  'Acknowledgments',
  'References',
  'Bibliography',
  'Appendix',
  'Figures & Tables',
  'Ethics Statement',
  'Conflict of Interest',
  'Author Information',
  'Formatting',
];

interface SectionInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabledSections?: string[];
}

export const SectionInput = ({
  id,
  value,
  onChange,
  placeholder = 'Enter or select section',
  required,
  disabledSections = [],
}: SectionInputProps) => {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = React.useMemo(() => {
    const base = value
      ? SECTION_SUGGESTIONS.filter((s) =>
          s.toLowerCase().includes(value.toLowerCase()),
        )
      : SECTION_SUGGESTIONS;
    const available = base.filter(
      (s) =>
        !disabledSections.some(
          (d) => d.trim().toLowerCase() === s.trim().toLowerCase(),
        ),
    );
    const inUse = base.filter((s) =>
      disabledSections.some(
        (d) => d.trim().toLowerCase() === s.trim().toLowerCase(),
      ),
    );
    return [...available, ...inUse];
  }, [value, disabledSections]);

  // Reset active index when filtered list changes
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  // Scroll active item into view
  React.useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
        break;
      case 'Tab':
        if (open && filtered.length > 0) {
          const idx = activeIndex >= 0 ? activeIndex : 0;
          onChange(filtered[idx]);
          setOpen(false);
          setActiveIndex(-1);
          e.preventDefault();
        }
        break;
      case 'Enter':
        if (open && activeIndex >= 0) {
          e.preventDefault();
          onChange(filtered[activeIndex]);
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 w-full items-center rounded-md border bg-transparent px-3 shadow-sm focus-within:ring-[3px]">
        <input
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="section-suggestions-list"
          aria-autocomplete="list"
          className="placeholder:text-muted-foreground flex-1 bg-transparent font-sans text-sm outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground mr-1"
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul
          id="section-suggestions-list"
          ref={listRef}
          role="listbox"
          className="bg-popover border-border absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border shadow-md"
        >
          {filtered.map((s, i) => {
            const isDisabled = disabledSections.some(
              (d) => d.trim().toLowerCase() === s.trim().toLowerCase(),
            );
            return (
              <li
                key={s}
                role="option"
                aria-selected={i === activeIndex}
                aria-disabled={isDisabled}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (isDisabled) return;
                  onChange(s);
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                onMouseEnter={() => !isDisabled && setActiveIndex(i)}
                className={cn(
                  'px-3 py-2 font-sans text-sm',
                  isDisabled
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'cursor-pointer',
                  !isDisabled && i === activeIndex
                    ? 'bg-accent font-medium'
                    : !isDisabled && 'hover:bg-accent',
                  !isDisabled &&
                    value === s &&
                    i !== activeIndex &&
                    'font-medium',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  {s}
                  {isDisabled && (
                    <span className="text-muted-foreground/60 text-xs">
                      In use
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
