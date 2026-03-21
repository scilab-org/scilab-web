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

import { paths } from '@/config/paths';
import { useJournals } from '../api/get-journals';
import { CreateJournal } from './create-journal';
import { DeleteJournal } from './delete-journal';
import { UpdateJournal } from './update-journal';
import { JournalsFilter } from './journals-filter';

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

export const JournalsList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';

  const journalsQuery = useJournals({
    params: {
      PageNumber: page,
      PageSize: 10,
      Name: name,
      IsDeleted: isDeleted,
    },
  });

  if (journalsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const journals = journalsQuery.data?.result?.items;
  const paging = journalsQuery.data?.result?.paging;

  if (!journals || journals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Journals</h2>
          <CreateJournal />
        </div>
        <JournalsFilter />
        <div className="flex h-48 w-full items-center justify-center">
          <p className="text-muted-foreground">No journals found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Journals</h2>
        <CreateJournal />
      </div>
      <JournalsFilter />

      <div className="overflow-x-auto rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-linear-to-r from-blue-50 to-cyan-50 hover:from-blue-50 hover:to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
              <TableHead className="w-[30%] font-semibold text-blue-900 dark:text-blue-200">
                Name
              </TableHead>
              <TableHead className="w-[15%] font-semibold text-blue-900 dark:text-blue-200">
                Styles
              </TableHead>
              <TableHead className="w-[20%] font-semibold text-blue-900 dark:text-blue-200">
                Created
              </TableHead>
              <TableHead className="w-[20%] font-semibold text-blue-900 dark:text-blue-200">
                Last Modified
              </TableHead>
              <TableHead className="w-[15%] text-right font-semibold text-blue-900 dark:text-blue-200">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journals.map((journal, index) => (
              <TableRow
                key={journal.id}
                className={`transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/20'}`}
              >
                <TableCell className="font-medium">
                  <Link
                    to={paths.app.journalManagement.journal.getHref(journal.id)}
                    className="text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {journal.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {journal.styles?.length ?? 0}
                  </span>
                </TableCell>
                <TableCell>
                  {journal.createdOnUtc
                    ? new Date(journal.createdOnUtc).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {journal.lastModifiedOnUtc
                    ? new Date(journal.lastModifiedOnUtc).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <UpdateJournal journalId={journal.id} journal={journal} />
                    <DeleteJournal journalId={journal.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {paging && (
          <div className="mt-6 grid grid-cols-3 items-center border-t px-6 py-4">
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
                      variant={
                        item === paging.pageNumber ? 'default' : 'outline'
                      }
                      size="icon"
                      className={`size-8 text-xs ${item === paging.pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                      asChild={item !== paging.pageNumber}
                    >
                      {item !== paging.pageNumber ? (
                        <Link to={buildPageUrl(item, searchParams)}>
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
    </div>
  );
};
