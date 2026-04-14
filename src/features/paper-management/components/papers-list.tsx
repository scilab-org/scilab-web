import { useSearchParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Tags,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

import { BTN } from '@/lib/button-styles';
import { usePapers } from '../api/get-papers';
import { getPaperQueryOptions } from '../api/get-paper';
import { DeletePaper } from './delete-paper';
import { PAPER_STATUS_MAP } from '../constants';
import { UpdatePaper } from './update-paper';
import { formatPublicationDate } from '@/utils/string-utils';

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

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

const getStatusVariant = (
  status: number,
): {
  variant:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'success'
    | 'outline'
    | 'muted';
  className?: string;
} => {
  switch (status) {
    case 1:
      return { variant: 'outline' };
    case 2:
      return { variant: 'default' };
    case 3:
      return { variant: 'secondary' };
    case 4:
      return { variant: 'success' };
    case 5:
      return { variant: 'muted' };
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
  const publisher = searchParams.get('publisher') || undefined;
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
  const authors = searchParams.getAll('author').length
    ? searchParams.getAll('author')
    : undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';
  const tags = searchParams.getAll('tag').length
    ? searchParams.getAll('tag')
    : undefined;

  const papersQuery = usePapers({
    params: {
      PageNumber: page,
      PageSize: 10,
      Title: title,
      Publisher: publisher,
      Abstract: abstract,
      Doi: doi,
      Status: status,
      FromPublicationDate: fromDate,
      ToPublicationDate: toDate,
      PaperType: paperType,
      JournalName: journalName,
      ConferenceName: conferenceName,
      Author: authors,
      Tag: tags,
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
    <div className="overflow-x-hidden rounded-xl border shadow-sm">
      <Table
        containerClassName="overflow-x-hidden"
        className="w-full table-fixed"
      >
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-muted-foreground w-[3%] px-2 text-xs leading-tight font-semibold tracking-wider uppercase">
              #
            </TableHead>
            <TableHead className="text-muted-foreground w-[10%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              DOI
            </TableHead>
            <TableHead className="text-muted-foreground w-[17%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Title
            </TableHead>
            <TableHead className="text-muted-foreground w-[14%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Authors
            </TableHead>
            <TableHead className="text-muted-foreground w-[15%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Journal / Conference
            </TableHead>
            <TableHead className="text-muted-foreground w-[9%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Publication Date
            </TableHead>
            <TableHead className="text-muted-foreground w-[8%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground w-[7%] px-2 text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Tags
            </TableHead>
            <TableHead className="text-muted-foreground w-[9%] px-2 text-center text-xs leading-tight font-semibold tracking-wider wrap-break-word whitespace-normal uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.map((paper, index) => (
            <TableRow key={paper.id} className="hover:bg-muted/30">
              {/* # STT */}
              <TableCell className="text-muted-foreground px-2 text-center text-xs">
                {(page - 1) * 10 + index + 1}
              </TableCell>

              {/* DOI */}
              <TableCell className="px-2 break-all whitespace-normal">
                {paper.doi ? (
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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
              <TableCell className="overflow-hidden px-2 font-medium wrap-break-word whitespace-normal">
                <Link
                  to={paths.app.paperManagement.paper.getHref(paper.id)}
                  className="block font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  onMouseEnter={() => {
                    queryClient.prefetchQuery(getPaperQueryOptions(paper.id));
                  }}
                >
                  <span className="line-clamp-3">{paper.title || 'N/A'}</span>
                </Link>
              </TableCell>

              {/* Authors */}
              <TableCell className="px-2 text-sm wrap-break-word whitespace-normal">
                {truncateAuthors(paper.authors)}
              </TableCell>

              {/* Venue (Journal + Conference combined) */}
              <TableCell className="px-2 wrap-break-word whitespace-normal">
                {paper.journalName ? (
                  <span className="line-clamp-2 text-sm">
                    {paper.journalName}
                  </span>
                ) : paper.conferenceName ? (
                  <span className="flex items-start gap-1.5 text-sm">
                    <Building2 className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                    <span className="line-clamp-2">{paper.conferenceName}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    —
                  </span>
                )}
              </TableCell>

              {/* Publication Date */}
              <TableCell className="px-2 whitespace-normal">
                {paper.publicationDate ? (
                  <span className="flex flex-wrap items-center gap-1.5 text-sm">
                    <Calendar className="text-muted-foreground size-3.5" />
                    {formatPublicationDate(paper.publicationDate)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    —
                  </span>
                )}
              </TableCell>

              {/* Status */}
              <TableCell className="px-2 whitespace-normal">
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

              {/* Tags */}
              <TableCell className="px-2 whitespace-normal">
                {paper.tagNames && paper.tagNames.length > 0 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-muted-foreground hover:text-foreground gap-1"
                      >
                        <Tags className="size-3" />
                        {paper.tagNames.length} tags
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64">
                      <p className="mb-2 text-sm font-medium">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {paper.tagNames.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs italic">
                    <Tags className="size-3 opacity-40" />
                    No tags
                  </span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="px-2 whitespace-nowrap">
                <div className="flex flex-nowrap items-center justify-center gap-1">
                  {paper.filePath ? (
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="text-foreground hover:bg-muted/50 size-8"
                    >
                      <a
                        href={paper.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="size-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      className={`size-8 ${BTN.CANCEL}`}
                    >
                      <FileText className="size-4" />
                    </Button>
                  )}
                  <UpdatePaper paper={paper} paperId={paper.id} />
                  <DeletePaper paperId={paper.id} />
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
