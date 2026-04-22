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

import { Pagination } from '@/components/ui/pagination';
import { paths } from '@/config/paths';
import { useJournals } from '../api/get-journals';
import { DeleteJournal } from './delete-journal';
import { UpdateJournal } from './update-journal';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : 'N/A';

export const JournalsList = () => {
  const [searchParams] = useSearchParams();

  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const issn = searchParams.get('issn') || undefined;
  const ranking = searchParams.get('ranking') || undefined;
  const type = searchParams.get('type') || undefined;
  const templateId = searchParams.get('templateId') || undefined;
  const projectId = searchParams.get('projectId') || undefined;
  const paperId = searchParams.get('paperId') || undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';

  const journalsQuery = useJournals({
    params: {
      PageNumber: page,
      PageSize: 10,
      Name: name,
      ISSN: issn,
      Ranking: ranking,
      Type: type,
      TemplateId: templateId,
      ProjectId: projectId,
      PaperId: paperId,
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
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-muted-foreground w-[28%] text-xs font-medium tracking-wider uppercase">
                Name
              </TableHead>
              <TableHead className="text-muted-foreground w-[10%] text-xs font-medium tracking-wider uppercase">
                Type
              </TableHead>
              <TableHead className="text-muted-foreground w-[12%] text-xs font-medium tracking-wider uppercase">
                ISSN
              </TableHead>
              <TableHead className="text-muted-foreground w-[10%] text-xs font-medium tracking-wider uppercase">
                Ranking
              </TableHead>
              <TableHead className="text-muted-foreground w-[10%] text-xs font-medium tracking-wider uppercase">
                Created Date
              </TableHead>
              <TableHead className="text-muted-foreground w-[24%] text-center text-xs font-medium tracking-wider uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journals.map((journal) => (
              <TableRow key={journal.id} className="hover:bg-muted/30">
                <TableCell className="max-w-80">
                  {journal.url ? (
                    <a
                      href={journal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary block truncate font-medium hover:underline"
                      title={journal.url}
                    >
                      {journal.name}
                    </a>
                  ) : (
                    <div className="truncate font-medium" title={journal.name}>
                      {journal.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {journal.type === 1
                    ? 'Journal'
                    : journal.type === 2
                      ? 'Conference'
                      : 'N/A'}
                </TableCell>
                <TableCell className="max-w-36 truncate">
                  {journal.issn || 'N/A'}
                </TableCell>
                <TableCell>{journal.ranking || 'N/A'}</TableCell>
                <TableCell>{fmt(journal.createdOnUtc)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
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
