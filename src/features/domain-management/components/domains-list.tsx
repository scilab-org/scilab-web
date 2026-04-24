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

import { useDomains } from '../api/get-domains';
import { DeleteDomain } from './delete-domain';
import { UpdateDomain } from './update-domain';

export const DomainsList = () => {
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;

  const domainsQuery = useDomains({
    params: {
      Name: name,
      PageNumber: page,
      PageSize: 10,
    },
  });

  if (domainsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const domains = domainsQuery.data?.result?.items;
  const paging = domainsQuery.data?.result?.paging;

  if (!domains || domains.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No domains found.</p>
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
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell className="font-medium">{domain.name}</TableCell>
              <TableCell>
                {domain.createdOnUtc
                  ? new Date(domain.createdOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {domain.lastModifiedOnUtc
                  ? new Date(domain.lastModifiedOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="pl-16 text-center">
                <div className="flex items-center justify-center gap-2">
                  <UpdateDomain domainId={domain.id} domain={domain} />
                  <DeleteDomain domainId={domain.id} />
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
