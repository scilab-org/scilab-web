import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const dotVariants = cva('size-2 shrink-0 rounded-full', {
  variants: {
    variant: {
      active: 'bg-green-500',
      disabled: 'bg-destructive',
      draft: 'bg-amber-400',
      completed: 'bg-blue-500',
      archived: 'bg-muted-foreground',
    },
  },
  defaultVariants: { variant: 'active' },
});

const DEFAULT_LABELS: Record<string, string> = {
  active: 'Active',
  disabled: 'Disabled',
  draft: 'Draft',
  completed: 'Completed',
  archived: 'Archived',
};

type StatusDotProps = VariantProps<typeof dotVariants> & {
  label?: string;
  className?: string;
};

export const StatusDot = ({ variant, label, className }: StatusDotProps) => (
  <div className={cn('flex items-center gap-2', className)}>
    <span className={dotVariants({ variant })} />
    <span className="text-xs font-medium">
      {label ?? (variant ? (DEFAULT_LABELS[variant] ?? variant) : '')}
    </span>
  </div>
);
