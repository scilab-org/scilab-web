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

import { useGapTypes } from '../api/get-gap-types';
import { DeleteGapType } from './delete-gap-type';
import { UpdateGapType } from './update-gap-type';

export const GapTypesList = () => {
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;
  const isDeleted = searchParams.get('isDeleted') === 'true';

  const gapTypesQuery = useGapTypes({
    params: {
      Name: name,
      IsDeleted: isDeleted,
      PageNumber: page,
      PageSize: 10,
    },
  });

  if (gapTypesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const gapTypes = gapTypesQuery.data?.result?.items;
  const paging = gapTypesQuery.data?.result?.paging;

  if (!gapTypes || gapTypes.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No gap types found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Name</TableHead>
            <TableHead className="w-[20%]">Created</TableHead>
            <TableHead className="w-[20%]">Last Modified</TableHead>
            <TableHead className="w-[25%] pl-16 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gapTypes.map((gapType) => (
            <TableRow key={gapType.id}>
              <TableCell className="font-medium">{gapType.name}</TableCell>
              <TableCell>
                {gapType.createdOnUtc
                  ? new Date(gapType.createdOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {gapType.lastModifiedOnUtc
                  ? new Date(gapType.lastModifiedOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="pl-16 text-center">
                <div className="flex items-center justify-center gap-2">
                  <UpdateGapType gapTypeId={gapType.id} gapType={gapType} />
                  <DeleteGapType gapTypeId={gapType.id} />
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
