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
import { Pagination } from '@/components/ui/pagination';
import { paths } from '@/config/paths';

export const PaperTemplatesList = () => {
  const [searchParams] = useSearchParams();

  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const code = searchParams.get('code') || undefined;

  const templatesQuery = usePaperTemplates({
    params: {
      PageNumber: page,
      PageSize: 10,
      Description: name,
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
    <div>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
              <TableHead className="w-[20%] text-xs font-semibold tracking-wider uppercase">
                Code
              </TableHead>
              <TableHead className="w-[65%] text-xs font-semibold tracking-wider uppercase">
                Description
              </TableHead>
              <TableHead className="w-[15%] text-center text-xs font-semibold tracking-wider uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id} className="hover:bg-muted/30">
                <TableCell>
                  <Badge variant="outline">{template.code}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {template.description || '—'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={paths.app.paperTemplateManagement.paperTemplate.getHref(
                        template.id,
                      )}
                    >
                      <Button variant="action">VIEW</Button>
                    </Link>
                    <UpdatePaperTemplate template={template} />
                    <DeletePaperTemplate
                      id={template.id}
                      code={template.code}
                    />
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
