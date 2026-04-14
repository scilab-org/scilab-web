import * as React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

export interface Paging {
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationProps {
  paging: Paging;
}

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

export const Pagination = ({ paging }: PaginationProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t px-4 py-4 md:flex-row">
      <p className="text-muted-foreground w-full text-center text-sm md:w-1/3 md:text-left">
        Page{' '}
        <span className="text-foreground font-medium">{paging.pageNumber}</span>{' '}
        of{' '}
        <span className="text-foreground font-medium">{paging.totalPages}</span>{' '}
        &middot; {paging.totalCount} results
      </p>

      <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-1/3">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={!paging.hasPreviousPage}
          asChild={paging.hasPreviousPage}
        >
          {paging.hasPreviousPage ? (
            <Link to={buildPageUrl(paging.pageNumber - 1, searchParams)}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </Button>

        {Array.from({ length: paging.totalPages }, (_, i) => i + 1)
          .filter((p) => {
            if (paging.totalPages <= 7) return true;
            if (p === 1 || p === paging.totalPages) return true;
            if (Math.abs(p - paging.pageNumber) <= 1) return true;
            return false;
          })
          .reduce<(number | string)[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
              acc.push('...');
            }
            acc.push(p);
            return acc;
          }, [])
          .map((item, idx) =>
            typeof item === 'string' ? (
              <span
                key={`ellipsis-${idx}`}
                className="text-muted-foreground px-0.5 text-sm"
              >
                ...
              </span>
            ) : (
              <Button
                key={item}
                variant={item === paging.pageNumber ? 'default' : 'outline'}
                size="icon"
                className="size-8 text-xs"
                asChild={item !== paging.pageNumber}
              >
                {item !== paging.pageNumber ? (
                  <Link to={buildPageUrl(item as number, searchParams)}>
                    {item}
                  </Link>
                ) : (
                  <span>{item}</span>
                )}
              </Button>
            ),
          )}

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={!paging.hasNextPage}
          asChild={paging.hasNextPage}
        >
          {paging.hasNextPage ? (
            <Link to={buildPageUrl(paging.pageNumber + 1, searchParams)}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>

      <div className="flex w-full items-center justify-center gap-1.5 md:w-1/3 md:justify-end">
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          Go to
        </span>
        <Input
          type="number"
          min={1}
          max={paging.totalPages}
          defaultValue={paging.pageNumber}
          className="h-8 w-14 text-center text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = Number((e.target as HTMLInputElement).value);
              if (val >= 1 && val <= paging.totalPages) {
                navigate(buildPageUrl(val, searchParams));
              }
            }
          }}
        />
      </div>
    </div>
  );
};
