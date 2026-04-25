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

import { useAffiliations } from '../api/get-affiliations';
import { DeleteAffiliation } from './delete-affiliation';
import { UpdateAffiliation } from './update-affiliation';

export const AffiliationsList = () => {
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;

  const affiliationsQuery = useAffiliations({
    params: {
      Name: name,
      PageNumber: page,
      PageSize: 10,
    },
  });

  if (affiliationsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const affiliations = affiliationsQuery.data?.result?.items;
  const paging = affiliationsQuery.data?.result?.paging;

  if (!affiliations || affiliations.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No affiliations found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[34%]">Name</TableHead>
            <TableHead className="w-[22%]">ROR ID</TableHead>
            <TableHead className="w-[14%]">Created</TableHead>
            <TableHead className="w-[14%]">Last Modified</TableHead>
            <TableHead className="w-[16%] pl-16 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {affiliations.map((affiliation) => (
            <TableRow key={affiliation.id}>
              <TableCell className="align-top font-medium break-words whitespace-normal">
                {affiliation.name}
              </TableCell>
              <TableCell>
                {affiliation.rorId ? (
                  <a
                    href={`https://ror.org/${affiliation.rorId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline"
                    title={`Open ${affiliation.rorId}`}
                  >
                    {affiliation.rorId}
                  </a>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {affiliation.createdOnUtc
                  ? new Date(affiliation.createdOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {affiliation.lastModifiedOnUtc
                  ? new Date(affiliation.lastModifiedOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="pl-16 text-center">
                <div className="flex items-center justify-center gap-2">
                  <UpdateAffiliation
                    affiliationId={affiliation.id}
                    affiliation={affiliation}
                  />
                  <DeleteAffiliation affiliationId={affiliation.id} />
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
