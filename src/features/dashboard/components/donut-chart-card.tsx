import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

ChartJS.register(ArcElement, Tooltip);

export type DonutChartItem = {
  label: string;
  count: number;
  color: string;
};

type DonutChartCardProps = {
  title: string;
  items: DonutChartItem[];
};

export const DonutChartCard = ({ title, items }: DonutChartCardProps) => {
  const visible = items.filter((i) => i.count > 0);
  const total = visible.reduce((s, i) => s + i.count, 0);

  const chartData = {
    labels: visible.map((i) => i.label),
    datasets: [
      {
        data: visible.map((i) => i.count),
        backgroundColor: visible.map((i) => i.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: '72%',
    plugins: { tooltip: { enabled: true }, legend: { display: false } },
    animation: { duration: 400 },
  } as const;

  return (
    <Card className="gap-0">
      <CardHeader className="border-b px-5 pt-5 pb-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {total === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            No data available
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative size-28 shrink-0">
              <Doughnut data={chartData} options={options} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-xl leading-none font-bold">
                  {total}
                </span>
                <span className="text-muted-foreground text-xs">total</span>
              </div>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-2">
              {visible.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-foreground min-w-0 flex-1 truncate font-medium">
                    {item.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DonutChartCardSkeleton = () => (
  <Card className="gap-0">
    <CardHeader className="border-b px-5 pt-5 pb-4">
      <Skeleton className="h-4 w-28" />
    </CardHeader>
    <CardContent className="flex items-center gap-6 px-5 py-4">
      <Skeleton className="size-28 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
