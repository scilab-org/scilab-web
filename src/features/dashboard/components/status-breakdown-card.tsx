import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type StatusBreakdownItem = {
  label: string;
  count: number;
  colorClass: string;
};

type StatusBreakdownCardProps = {
  title: string;
  items: StatusBreakdownItem[];
};

export const StatusBreakdownCard = ({
  title,
  items,
}: StatusBreakdownCardProps) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b px-5 pt-5 pb-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {total === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            No data available
          </p>
        ) : (
          <div className="space-y-2.5">
            {items
              .filter((item) => item.count > 0)
              .map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        item.colorClass,
                      )}
                    />
                    <span className="text-foreground truncate text-xs font-medium">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-border h-1.5 w-20 overflow-hidden rounded-full">
                      <div
                        className={cn('h-full rounded-full', item.colorClass)}
                        style={{
                          width: `${Math.round((item.count / total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const StatusBreakdownCardSkeleton = () => (
  <Card className="gap-0">
    <CardHeader className="border-b px-5 pt-5 pb-4">
      <Skeleton className="h-4 w-36" />
    </CardHeader>
    <CardContent className="space-y-3 px-5 py-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </CardContent>
  </Card>
);
