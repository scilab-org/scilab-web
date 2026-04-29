import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
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

import { usePapers } from '../api/get-papers';
import { getPaperQueryOptions } from '../api/get-paper';
import { DeletePaper } from './delete-paper';
import { UpdatePaper } from './update-paper';
import { Pagination } from '@/components/ui/pagination';

const getPaperVenueLabel = (paper: {
  conferenceJournalType?: number | null;
  conferenceJournalName?: string | null;
  journalName?: string | null;
  conferenceName?: string | null;
}) =>
  paper.conferenceJournalName?.trim() ||
  paper.journalName?.trim() ||
  paper.conferenceName?.trim() ||
  '—';

const getPaperVenueTypeLabel = (paper: {
  conferenceJournalType?: number | null;
}) => {
  if (paper.conferenceJournalType === 1) return 'Journal';
  if (paper.conferenceJournalType === 2) return 'Conference';
  return '';
};

const truncateAuthors = (authors: string | null): React.ReactNode => {
  if (!authors) return null;
  const parts = authors
    .split(' and ')
    .map((a) => a.trim())
    .filter(Boolean);
  if (parts.length <= 2) {
    return <span>{parts.join(' & ')}</span>;
  }
  return (
    <span title={authors}>
      {parts[0]}
      <span className="text-muted-foreground mx-0.5">·</span>
      {parts[parts.length - 1]}
      <span className="text-muted-foreground ml-1 text-xs italic">
        +{parts.length - 2} more
      </span>
    </span>
  );
};

export const PapersList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const page = +(searchParams.get('page') || 1);
  const title = searchParams.get('title') || undefined;
  const publisher = searchParams.get('publisher') || undefined;
  const abstract = searchParams.get('abstract') || undefined;
  const doi = searchParams.get('doi') || undefined;
  const fromDate = searchParams.get('fromDate') || undefined;
  const toDate = searchParams.get('toDate') || undefined;
  const paperType = searchParams.get('paperType') || undefined;
  const journalId = searchParams.get('journalId') || undefined;
  const ranking = searchParams.get('ranking') || undefined;
  const authors = searchParams.getAll('author').length
    ? searchParams.getAll('author')
    : undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';
  const keywords = searchParams.getAll('keyword').length
    ? searchParams.getAll('keyword')
    : undefined;

  const papersQuery = usePapers({
    params: {
      PageNumber: page,
      PageSize: 10,
      Title: title,
      Publisher: publisher,
      Abstract: abstract,
      Doi: doi,
      FromPublicationDate: fromDate,
      ToPublicationDate: toDate,
      PaperType: paperType,
      JournalId: journalId,
      Ranking: ranking,
      Author: authors,
      Keyword: keywords,
      IsDeleted: isDeleted,
    },
  });

  if (papersQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const papers = papersQuery.data?.result?.items;
  const paging = papersQuery.data?.result?.paging;

  if (!papers || papers.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No papers found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden rounded-md border shadow-sm">
      <Table
        containerClassName="overflow-x-hidden"
        className="w-full table-fixed"
      >
        <TableHeader>
          <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
            <TableHead className="w-[16%] px-8 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              DOI
            </TableHead>
            <TableHead className="w-[28%] px-3 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Title
            </TableHead>
            <TableHead className="w-[18%] px-3 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Authors
            </TableHead>
            <TableHead className="w-[18%] px-3 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Journal / Conference
            </TableHead>
            <TableHead className="w-[20%] px-8 text-center text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.map((paper) => (
            <TableRow key={paper.id} className="hover:bg-surface-container-low">
              {/* DOI */}
              <TableCell className="px-8 break-all whitespace-normal">
                {paper.doi ? (
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-foreground/80 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                    title={paper.doi}
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    <span className="break-all">{paper.doi}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    N/A
                  </span>
                )}
              </TableCell>

              {/* Title */}
              <TableCell className="px-3 font-medium wrap-break-word whitespace-normal">
                <span
                  className="text-foreground block font-medium wrap-break-word whitespace-normal transition-colors"
                  title={paper.title || 'N/A'}
                >
                  {paper.title || 'N/A'}
                </span>
              </TableCell>

              {/* Authors */}
              <TableCell className="px-3 text-sm wrap-break-word whitespace-normal">
                {truncateAuthors(paper.authors)}
              </TableCell>

              {/* Venue */}
              <TableCell className="px-3 wrap-break-word whitespace-normal">
                {paper.conferenceJournalName ? (
                  <span
                    className="block text-sm wrap-break-word whitespace-normal"
                    title={getPaperVenueTypeLabel(paper as any)}
                  >
                    {getPaperVenueLabel(paper as any)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    —
                  </span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="px-8 whitespace-nowrap">
                <div className="flex flex-nowrap items-center justify-center gap-1">
                  <Button variant="outlineAction" size="action" asChild>
                    <Link
                      to={paths.app.paperManagement.paper.getHref(paper.id)}
                      onMouseEnter={() => {
                        queryClient.prefetchQuery(
                          getPaperQueryOptions(paper.id),
                        );
                      }}
                    >
                      VIEW
                    </Link>
                  </Button>
                  <UpdatePaper paper={paper} paperId={paper.id} />
                  <DeletePaper paperId={paper.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paging && <Pagination paging={paging} />}
    </div>
  );
};
