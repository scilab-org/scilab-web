import * as React from 'react';
import { Link } from 'react-router';

import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  className?: string;
};

export const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  href,
  className,
}: StatCardProps) => (
  <Card className={cn('gap-0 py-5', className)}>
    <CardContent className="px-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        {Icon && (
          <Icon className="text-muted-foreground/50 mt-0.5 size-4 shrink-0" />
        )}
      </div>
      <p className="text-foreground mt-2 font-serif text-3xl leading-none font-bold">
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-1.5 text-xs">{sub}</p>}
      {href && (
        <Link
          to={href}
          className="text-muted-foreground hover:text-foreground mt-3 block text-xs transition-colors"
        >
          View more
        </Link>
      )}
    </CardContent>
  </Card>
);

export const StatCardSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn('gap-0 py-5', className)}>
    <CardContent className="px-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </CardContent>
  </Card>
);
