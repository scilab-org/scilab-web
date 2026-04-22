import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

type MultiValueInputProps = {
  values: string[];
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export const MultiValueInput = ({
  values,
  onAddValue,
  onRemoveValue,
  placeholder = 'Type a value and press Enter...',
  className,
  inputClassName,
}: MultiValueInputProps) => {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAddValue = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !values.some((item) => item.toLowerCase() === trimmed.toLowerCase())
    ) {
      onAddValue(trimmed);
    }

    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (inputValue.trim()) {
        handleAddValue(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      e.preventDefault();
      onRemoveValue(values[values.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        'focus-within:border-ring focus-within:ring-ring/50 border-input bg-background flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5 shadow-none transition-[color,box-shadow] focus-within:ring-[3px]',
        className,
      )}
    >
      {values.map((value) => (
        <Badge
          key={value}
          variant="secondary"
          className="gap-1 pr-1 text-xs text-white"
        >
          {value}
          <button
            type="button"
            onClick={() => onRemoveValue(value)}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? placeholder : ''}
        className={cn(
          'placeholder:text-muted-foreground min-w-30 flex-1 bg-transparent text-sm outline-none',
          inputClassName,
        )}
      />
      {inputValue && (
        <button
          type="button"
          onClick={() => {
            setInputValue('');
            inputRef.current?.focus();
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};
