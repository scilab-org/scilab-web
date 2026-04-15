import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router';

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
import { useTags } from '../api/get-tags';
import { DeleteTag } from './delete-tag';
import { UpdateTag } from './update-tag';

export const TagsList = () => {
  const [searchParams] = useSearchParams();

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
          <TableRow>
            <TableHead className="w-[35%]">Name</TableHead>
            <TableHead className="w-[20%]">Created</TableHead>
            <TableHead className="w-[20%]">Last Modified</TableHead>
            <TableHead className="w-[25%] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
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
                  <Button variant="outlineAction" size="action">
                    VIEW
                  </Button>
                  <UpdateTag tagId={tag.id} tag={tag} />
                  <DeleteTag tagId={tag.id} />
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
