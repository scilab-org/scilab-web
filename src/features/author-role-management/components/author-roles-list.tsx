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

import { useAuthorRoles } from '../api/get-author-roles';
import { DeleteAuthorRole } from './delete-author-role';
import { UpdateAuthorRole } from './update-author-role';
import { Authorization } from '@/lib/authorization';
import { GROUPS } from '@/lib/authorization';

export const AuthorRolesList = () => {
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const name = searchParams.get('name') || undefined;

  const authorRolesQuery = useAuthorRoles({
    params: {
      Name: name,
      PageNumber: page,
      PageSize: 10,
    },
  });

  if (authorRolesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const authorRoles = authorRolesQuery.data?.result?.items;
  const paging = authorRolesQuery.data?.result?.paging;

  if (!authorRoles || authorRoles.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <p className="text-muted-foreground">No author roles found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[24%]">Name</TableHead>
            <TableHead className="w-[46%]">Description</TableHead>
            <TableHead className="w-[14%]">Created</TableHead>
            <TableHead className="w-[16%] pl-16 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {authorRoles.map((authorRole) => (
            <TableRow key={authorRole.id}>
              <TableCell className="align-top font-medium break-words whitespace-normal">
                {authorRole.name}
              </TableCell>
              <TableCell className="align-top break-words whitespace-normal">
                {authorRole.description || 'N/A'}
              </TableCell>
              <TableCell className="align-top">
                {authorRole.createdOnUtc
                  ? new Date(authorRole.createdOnUtc).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="pl-16 text-center align-top">
                <Authorization allowedGroups={[GROUPS.PROJECT_PUBLISHER]}>
                  <div className="flex items-center justify-center gap-2">
                    <UpdateAuthorRole
                      authorRoleId={authorRole.id}
                      authorRole={authorRole}
                    />
                    <DeleteAuthorRole authorRoleId={authorRole.id} />
                  </div>
                </Authorization>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {paging && <Pagination paging={paging} />}
    </div>
  );
};
