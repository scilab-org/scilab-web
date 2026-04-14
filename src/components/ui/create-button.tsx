import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, buttonVariants } from './button';
import { cn } from '@/utils/cn';

export interface CreateButtonProps extends React.ComponentProps<typeof Button> {
  label?: string;
  variant?: CreateButtonVariant;
}

type CreateButtonVariant = 'default' | 'secondary' | 'darkRed' | 'outline';

export const CreateButton = React.forwardRef<
  HTMLButtonElement,
  CreateButtonProps
>(
  (
    { label = 'Create', variant = 'darkRed', className, children, ...props },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      >
        <Plus className="mr-1 size-4" />
        {children || label}
      </Button>
    );
  },
);

CreateButton.displayName = 'CreateButton';
