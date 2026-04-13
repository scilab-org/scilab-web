import * as React from 'react';
import { ChevronDown } from 'lucide-react';

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

export const FilterSelect = ({
  value,
  onChange,
  children,
}: FilterSelectProps) => (
  <div className="relative flex items-center">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-muted-foreground h-full cursor-pointer appearance-none bg-transparent pr-8 pl-4 font-mono text-[11px] tracking-widest uppercase outline-none"
    >
      {children}
    </select>
    <ChevronDown className="text-muted-foreground pointer-events-none absolute right-2.5 size-3.5" />
  </div>
);
