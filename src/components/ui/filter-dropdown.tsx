import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

type FilterOption = {
  label: string;
  value: string;
};

type FilterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
};

export const FilterDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  variant = 'ghost',
}: FilterDropdownProps & { variant?: 'ghost' | 'outline' }) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex cursor-pointer items-center justify-between gap-2 transition-colors outline-none',
          variant === 'ghost' &&
            'text-muted-foreground hover:text-foreground data-[state=open]:text-foreground h-full bg-transparent px-4 text-sm font-medium',
          variant === 'outline' &&
            'border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1',
          className,
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'shrink-0 opacity-50',
            variant === 'ghost' ? 'size-4' : 'size-4',
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === 'ghost' ? 'end' : 'start'}
        className={cn(
          variant === 'ghost'
            ? 'w-[160px]'
            : 'w-[var(--radix-dropdown-menu-trigger-width)] min-w-[160px]',
        )}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="">
            <span className={cn('text-muted-foreground text-sm')}>
              {variant === 'ghost' ? placeholder : 'All'}
            </span>
          </DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <span className="text-sm">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
