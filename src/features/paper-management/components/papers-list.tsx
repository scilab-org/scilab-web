import { useSearchParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
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

import { usePapers } from '../api/get-papers';
import { getPaperQueryOptions } from '../api/get-paper';
import { DeletePaper } from './delete-paper';
import { PAPER_STATUS_MAP } from '../constants';

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

const getStatusVariant = (
  status: number,
): {
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
  className?: string;
} => {
  switch (status) {
    case 1:
      return { variant: 'secondary' };
    case 2:
      return {
        variant: 'default',
        className: 'bg-blue-600 text-white hover:bg-blue-700',
      };
    case 3:
      return {
        variant: 'default',
        className: 'bg-amber-500 text-white hover:bg-amber-600',
      };
    case 4:
      return { variant: 'success' };
    default:
      return { variant: 'outline' };
  }
};

export const PapersList = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const page = +(searchParams.get('page') || 1);
  const title = searchParams.get('title') || undefined;
  const abstract = searchParams.get('abstract') || undefined;
  const doi = searchParams.get('doi') || undefined;
  const status = searchParams.get('status')
    ? Number(searchParams.get('status'))
    : undefined;
  const fromDate = searchParams.get('fromDate') || undefined;
  const toDate = searchParams.get('toDate') || undefined;
  const paperType = searchParams.get('paperType') || undefined;
  const journalName = searchParams.get('journalName') || undefined;
  const conferenceName = searchParams.get('conferenceName') || undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';

  const papersQuery = usePapers({
    params: {
      PageNumber: page,
      PageSize: 10,
      Title: title,
      Abstract: abstract,
      Doi: doi,
      Status: status,
      FromPublicationDate: fromDate,
      ToPublicationDate: toDate,
      PaperType: paperType,
      JournalName: journalName,
      ConferenceName: conferenceName,
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Title</TableHead>
            <TableHead className="w-[12%]">DOI</TableHead>
            <TableHead className="w-[10%]">Paper Type</TableHead>
            <TableHead className="w-[15%]">Journal / Conference</TableHead>
            <TableHead className="w-[12%]">Publication Date</TableHead>
            <TableHead className="w-[8%]">Status</TableHead>
            <TableHead className="w-[18%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.map((paper) => (
            <TableRow key={paper.id}>
              <TableCell className="truncate font-medium">
                <Link
                  to={paths.app.paperManagement.paper.getHref(paper.id)}
                  className="text-primary hover:underline"
                  onMouseEnter={() => {
                    queryClient.prefetchQuery(getPaperQueryOptions(paper.id));
                  }}
                >
                  {paper.title || 'N/A'}
                </Link>
              </TableCell>
              <TableCell className="truncate">{paper.doi || 'N/A'}</TableCell>
              <TableCell className="truncate">
                {paper.paperType || 'N/A'}
              </TableCell>
              <TableCell className="truncate">
                {paper.journalName || paper.conferenceName || 'N/A'}
              </TableCell>
              <TableCell>
                {paper.publicationDate
                  ? new Date(paper.publicationDate).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {(() => {
                  const statusStyle = getStatusVariant(paper.status);
                  return (
                    <Badge
                      variant={statusStyle.variant}
                      className={statusStyle.className}
                    >
                      {PAPER_STATUS_MAP[paper.status] || 'Unknown'}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {paper.filePath ? (
                    <Button variant="outline" size="xs" asChild>
                      <a
                        href={paper.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="size-3" />
                        PDF
                      </a>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="xs" disabled>
                      <FileText className="size-3" />
                      No file
                    </Button>
                  )}
                  <Button variant="outline" size="xs" asChild>
                    <Link
                      to={paths.app.paperManagement.paper.getHref(paper.id)}
                    >
                      View
                    </Link>
                  </Button>
                  <DeletePaper paperId={paper.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paging && (
        <div className="mt-6 grid grid-cols-3 items-center border-t pt-4">
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
                    className={`size-8 text-xs ${item === paging.pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
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
