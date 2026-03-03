import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
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

import { usePaperTemplates } from '../api/get-paper-templates';
import { DeletePaperTemplate } from './delete-paper-template';
import { UpdatePaperTemplate } from './update-paper-template';
import { ViewPaperTemplate } from './view-paper-template';

const buildPageUrl = (page: number, currentParams: URLSearchParams) => {
  const params = new URLSearchParams(currentParams);
  params.set('page', page.toString());
  return `?${params.toString()}`;
};

export const PaperTemplatesList = () => {
  const [searchParams] = useSearchParams();

  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const code = searchParams.get('code') || undefined;

  const templatesQuery = usePaperTemplates({
    params: {
      PageNumber: page,
      PageSize: 10,
      Name: name,
      Code: code,
    },
  });

  if (templatesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const templates = templatesQuery.data?.result?.items;
  const paging = templatesQuery.data?.result?.paging;

  if (!templates || templates.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No paper templates found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18%]">Name</TableHead>
            <TableHead className="w-[13%]">Code</TableHead>
            <TableHead className="w-[20%]">Description</TableHead>
            <TableHead className="w-[25%]">Sections</TableHead>
            <TableHead className="w-[12%]">Created</TableHead>
            <TableHead className="w-[12%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{template.code}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {template.description || '—'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {template.templateStructure?.sections
                    ?.slice(0, 4)
                    .map((section) => (
                      <Badge
                        key={section.key}
                        variant="secondary"
                        className="text-xs"
                      >
                        {section.title}
                      </Badge>
                    ))}
                  {(template.templateStructure?.sections?.length ?? 0) > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.templateStructure.sections.length - 4} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {template.createdOnUtc
                  ? new Date(template.createdOnUtc).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <ViewPaperTemplate id={template.id} name={template.name} />
                  <UpdatePaperTemplate template={template} />
                  <DeletePaperTemplate id={template.id} name={template.name} />
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
                    className="text-muted-foreground px-1"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === paging.pageNumber ? 'default' : 'outline'}
                    size="icon"
                    className="size-8"
                    asChild={item !== paging.pageNumber}
                  >
                    {item !== paging.pageNumber ? (
                      <Link to={buildPageUrl(item, searchParams)}>{item}</Link>
                    ) : (
                      String(item)
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

          <div />
        </div>
      )}
    </div>
  );
};
