import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router';

import { Link } from 'react-router';

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
import { DeleteJournal } from './delete-journal';
import { UpdateJournal } from './update-journal';
import { Pagination } from '@/components/ui/pagination';

export const JournalsList = () => {
  const [searchParams] = useSearchParams();

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
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">
          {name
            ? 'No journals match your search criteria'
            : 'No journals found.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-muted-foreground w-[30%] text-xs font-medium tracking-wider uppercase">
                Name
              </TableHead>
              <TableHead className="text-muted-foreground w-[15%] text-xs font-medium tracking-wider uppercase">
                Styles
              </TableHead>
              <TableHead className="text-muted-foreground w-[20%] text-xs font-medium tracking-wider uppercase">
                Created
              </TableHead>
              <TableHead className="text-muted-foreground w-[20%] text-xs font-medium tracking-wider uppercase">
                Last Modified
              </TableHead>
              <TableHead className="text-muted-foreground w-[15%] text-right text-xs font-medium tracking-wider uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journals.map((journal) => (
              <TableRow key={journal.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  <span className="text-foreground transition-colors">
                    {journal.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="bg-muted text-foreground inline-block rounded-full px-2.5 py-0.5 text-sm font-medium">
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
                    <Link
                      to={paths.app.journalManagement.journal.getHref(
                        journal.id,
                      )}
                    >
                      <Button variant="outlineAction" size="action">
                        VIEW
                      </Button>
                    </Link>
                    <UpdateJournal journalId={journal.id} journal={journal} />
                    <DeleteJournal journalId={journal.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {paging && <Pagination paging={paging} />}
      </div>
    </div>
  );
};
