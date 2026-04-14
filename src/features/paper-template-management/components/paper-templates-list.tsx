import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
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
    <div className="overflow-x-auto rounded-xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
            <TableHead className="w-[13%]">Code</TableHead>
            <TableHead className="w-[18%]">Name</TableHead>
            <TableHead className="w-[20%]">Description</TableHead>
            <TableHead className="w-[25%]">Sections</TableHead>
            <TableHead className="w-[12%]">Created</TableHead>
            <TableHead className="w-[12%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow
              key={template.id}
              className="hover:bg-surface-container-low bg-white transition-colors"
            >
              <TableCell>
                <Badge variant="outline">{template.code}</Badge>
              </TableCell>
              <TableCell className="font-medium">{template.name}</TableCell>
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
                  <Button variant="outlineAction" size="action">
                    VIEW
                  </Button>
                  <UpdatePaperTemplate template={template} />
                  <DeletePaperTemplate id={template.id} name={template.name} />
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
