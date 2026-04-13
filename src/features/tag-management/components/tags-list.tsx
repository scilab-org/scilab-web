import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useTags } from '../api/get-tags';
import { DeleteTag } from './delete-tag';
import { UpdateTag } from './update-tag';

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

export const TagsList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';

  const tagsQuery = useTags({
    params: {
      PageNumber: page,
      PageSize: 10,
      Name: name,
      IsDeleted: isDeleted,
    },
  });

  if (tagsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const tags = tagsQuery.data?.result?.items;
  const paging = tagsQuery.data?.result?.paging;

  if (!tags || tags.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No tags found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-muted-foreground w-[35%] text-xs font-medium tracking-wider uppercase">
              Name
            </TableHead>
            <TableHead className="text-muted-foreground w-[20%] text-xs font-medium tracking-wider uppercase">
              Created
            </TableHead>
            <TableHead className="text-muted-foreground w-[20%] text-xs font-medium tracking-wider uppercase">
              Last Modified
            </TableHead>
            <TableHead className="text-muted-foreground w-[25%] text-right text-xs font-medium tracking-wider uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag, index) => (
            <TableRow key={tag.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{tag.name}</TableCell>
              <TableCell>
                {tag.createdOnUtc
                  ? new Date(tag.createdOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {tag.lastModifiedOnUtc
                  ? new Date(tag.lastModifiedOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <UpdateTag tagId={tag.id} tag={tag} />
                  <DeleteTag tagId={tag.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paging && (
        <div className="mt-6 grid grid-cols-3 items-center border-t px-4 pt-4 pb-4">
          <p className="text-muted-foreground text-sm">
            Page{' '}
            <span className="text-foreground font-medium">
              {paging.pageNumber}
            </span>{' '}
            of{' '}
            <span className="text-foreground font-medium">
              {paging.totalPages}
            </span>{' '}
            &middot; {paging.totalCount} results
          </p>

          <div className="flex items-center justify-center gap-2">
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
                      <Link to={buildPageUrl(item, searchParams)}>{item}</Link>
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

            <div className="ml-3 flex items-center gap-1.5 border-l pl-3">
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
          <div />
        </div>
      )}
    </div>
  );
};
