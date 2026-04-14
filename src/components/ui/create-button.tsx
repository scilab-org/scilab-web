import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/utils/cn';

export interface CreateButtonProps extends React.ComponentProps<typeof Button> {
  label?: string;
}

export const CreateButton = React.forwardRef<
  HTMLButtonElement,
  CreateButtonProps
>(({ label = 'Create', className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        'btn-create h-9 px-4 text-sm font-semibold tracking-wide uppercase',
        className,
      )}
      {...props}
    >
      <Plus className="mr-1 size-4" />
      {children || label}
    </Button>
  );
});

CreateButton.displayName = 'CreateButton';
