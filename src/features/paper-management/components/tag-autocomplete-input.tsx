import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { useTags } from '@/features/tag-management/api/get-tags';
import { cn } from '@/utils/cn';

type TagAutocompleteInputProps = {
  tagList: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  /** Names that should render with an amber/gold badge (AI-suggested from paper) */
  suggestedTags?: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export const TagAutocompleteInput = ({
  tagList,
  onAddTag,
  onRemoveTag,
  suggestedTags,
  placeholder = 'Type a keyword and press Enter...',
  className,
  inputClassName,
}: TagAutocompleteInputProps) => {
  const [tagInput, setTagInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fetch tags with search query
  const { data: tagsData, isLoading } = useTags({
    params: {
      Name: tagInput.trim(),
      PageSize: 10,
    },
    queryConfig: {
      enabled: tagInput.trim().length > 0,
    },
  });

  const suggestions = React.useMemo(() => {
    if (!tagsData?.result?.items) return [];

    // Filter out tags that are already in the list
    return tagsData.result.items
      .map((tag) => tag.name)
      .filter(
        (tagName) =>
          !tagList.some((t) => t.toLowerCase() === tagName.toLowerCase()),
      );
  }, [tagsData, tagList]);

  // Reset selected index when suggestions change
  React.useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions.length, tagInput]);

  const handleAddTag = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !tagList.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      onAddTag(trimmed);
    }
    setTagInput('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        setShowSuggestions(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // If a suggestion is selected, add it; otherwise add the typed text
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleAddTag(suggestions[selectedIndex]);
      } else if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && tagList.length > 0) {
      e.preventDefault();
      onRemoveTag(tagList[tagList.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        setShowSuggestions(true);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  return (
    <Popover open={showSuggestions && suggestions.length > 0}>
      <div
        className={cn(
          'border-input bg-background focus-within:border-ring focus-within:ring-ring/50 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5 shadow-sm transition-[color,box-shadow] focus-within:ring-[3px]',
          className,
        )}
      >
        {tagList.map((tag) => {
          const isSuggested = suggestedTags?.some(
            (s) => s.toLowerCase() === tag.toLowerCase(),
          );
          return (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                'gap-1 pr-1 text-xs',
                isSuggested &&
                  'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100',
              )}
              title={isSuggested ? 'Extracted From Paper Content' : undefined}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          );
        })}
        <PopoverAnchor asChild>
          <input
            ref={inputRef}
            type="text"
            value={tagInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (tagInput.trim().length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click on suggestions
              setTimeout(() => {
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }, 200);
            }}
            placeholder={tagList.length === 0 ? placeholder : ''}
            className={cn(
              'placeholder:text-muted-foreground min-w-30 flex-1 bg-transparent text-sm outline-none',
              inputClassName,
            )}
          />
        </PopoverAnchor>
        {tagInput && (
          <button
            type="button"
            onClick={() => {
              setTagInput('');
              setShowSuggestions(false);
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="text-muted-foreground px-3 py-2 text-sm">
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary/10'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  {index === selectedIndex ? (
                    <span className="inline-flex w-fit items-center justify-center rounded-full border border-transparent bg-blue-600 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
                      {suggestion}
                    </span>
                  ) : (
                    <Badge variant="secondary" className="text-xs text-white">
                      {suggestion}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};
