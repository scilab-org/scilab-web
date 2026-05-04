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

export const CheckListsList = () => {
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const section = searchParams.get('section') || undefined;
  const ruleName = searchParams.get('ruleName') || undefined;
  const item = searchParams.get('item') || undefined;
  const weightParam = searchParams.get('weight');
  const weight =
    weightParam !== null && weightParam !== ''
      ? Number(weightParam)
      : undefined;

  const checkListsQuery = useCheckLists({
    params: {
      Section: section,
      RuleName: ruleName,
      Item: item,
      Weight: weight,
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
            <TableHead className="w-[20%]">Section</TableHead>
            <TableHead className="w-[15%]">Rule Name</TableHead>
            <TableHead className="w-[40%]">Item</TableHead>
            <TableHead className="w-[8%] text-center">Weight</TableHead>
            <TableHead className="w-[17%] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkLists.map((cl) => (
            <TableRow key={cl.id}>
              <TableCell className="font-medium">
                <span
                  className="block max-w-[160px] truncate"
                  title={cl.section}
                >
                  {cl.section}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className="block max-w-[120px] truncate"
                  title={cl.ruleName}
                >
                  {cl.ruleName}
                </span>
              </TableCell>
              <TableCell>
                <span className="block max-w-[320px] truncate" title={cl.item}>
                  {cl.item}
                </span>
              </TableCell>
              <TableCell className="text-center">{cl.weight}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
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
