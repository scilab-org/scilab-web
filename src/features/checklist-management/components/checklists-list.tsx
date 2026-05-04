import * as React from 'react';
import { useSearchParams } from 'react-router';

import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useCheckLists } from '../api/get-checklists';
import { DeleteCheckList } from './delete-checklist';
import { UpdateCheckList } from './update-checklist';
import { ViewCheckList } from './view-checklist';

export const CheckListsList = () => {
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const section = searchParams.get('section') || undefined;
  const name = searchParams.get('name') || undefined;
  const weightParam = searchParams.get('weight');
  const weight =
    weightParam !== null && weightParam !== ''
      ? Number(weightParam)
      : undefined;
  const isDeletedParam = searchParams.get('isDeleted');
  const isDeleted =
    isDeletedParam === null || isDeletedParam === ''
      ? undefined
      : isDeletedParam === 'true';

  const checkListsQuery = useCheckLists({
    params: {
      Section: section,
      Name: name,
      Weight: weight,
      IsDeleted: isDeleted,
      PageNumber: page,
      PageSize: 10,
    },
  });

  if (checkListsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const checkLists = checkListsQuery.data?.result?.items;
  const paging = checkListsQuery.data?.result?.paging;

  if (!checkLists || checkLists.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No check list items found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18%]">Section</TableHead>
            <TableHead className="w-[50%]">Item Names</TableHead>
            <TableHead className="w-[10%] text-center">Total Items</TableHead>
            <TableHead className="w-[18%] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkLists.map((cl) => (
            <TableRow key={cl.id}>
              <TableCell className="font-medium">
                <span className="block max-w-40 truncate" title={cl.section}>
                  {cl.section}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className="block max-w-105 truncate text-sm"
                  title={cl.items.map((item) => item.name).join(', ')}
                >
                  {cl.items.length > 0
                    ? cl.items.map((item) => item.name).join(', ')
                    : 'No items'}
                </span>
              </TableCell>
              <TableCell className="text-center">{cl.items.length}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <ViewCheckList checkListId={cl.id} />
                  <UpdateCheckList checkListId={cl.id} checkList={cl} />
                  <DeleteCheckList checkListId={cl.id} />
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
