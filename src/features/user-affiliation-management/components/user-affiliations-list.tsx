import { Loader } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useDeleteUserAffiliation } from '../api/delete-user-affiliation';
import { useUserAffiliations } from '../api/get-user-affiliations';
import { UpdateUserAffiliation } from './update-user-affiliation';

const formatYears = (
  affiliationStartYear: number | null,
  affiliationEndYear: number | null,
) => {
  const currentYear = new Date().getFullYear();

  if (affiliationStartYear === null && affiliationEndYear === null) {
    return '-';
  }

  if (affiliationStartYear === null) {
    return `${currentYear} - ${affiliationEndYear ?? currentYear}`;
  }

  if (affiliationEndYear === null) {
    return `${affiliationStartYear} - ${currentYear}`;
  }

  return `${affiliationStartYear} - ${affiliationEndYear}`;
};

export const UserAffiliationsList = ({ userId }: { userId: string }) => {
  const affiliationsQuery = useUserAffiliations({ userId });
  const deleteMutation = useDeleteUserAffiliation({
    mutationConfig: {
      onSuccess: () => toast.success('Affiliation removed successfully'),
      onError: () => toast.error('Failed to remove affiliation'),
    },
  });

  if (affiliationsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const items = affiliationsQuery.data?.result || [];

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground text-sm">No affiliations found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table className="table-fixed" containerClassName="overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%] whitespace-normal">
              Affiliation
            </TableHead>
            <TableHead className="w-[18%] whitespace-normal">
              Department
            </TableHead>
            <TableHead className="w-[14%] whitespace-normal">
              Position
            </TableHead>
            <TableHead className="w-[14%] whitespace-normal">ROR ID</TableHead>
            <TableHead className="w-[12%] whitespace-normal">Years</TableHead>
            <TableHead className="w-[12%] text-center whitespace-normal">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="align-top font-medium whitespace-normal">
                <div className="space-y-1">
                  <p className="text-foreground text-sm leading-snug font-medium break-words">
                    {item.affiliation.name}
                  </p>
                  {item.affiliation.shortName && (
                    <p className="text-muted-foreground text-xs leading-snug break-words">
                      {item.affiliation.shortName}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <span className="block text-sm leading-snug break-words">
                  {item.department || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <span className="block text-sm leading-snug break-words">
                  {item.position || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                {item.affiliation.rorUrl ? (
                  <a
                    href={item.affiliation.rorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary block font-bold break-all underline-offset-2 hover:underline"
                  >
                    {item.affiliation.rorId || item.affiliation.rorUrl}
                  </a>
                ) : (
                  <span className="block font-bold break-words">
                    {item.affiliation.rorId || 'N/A'}
                  </span>
                )}
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <span className="block text-sm leading-snug">
                  {formatYears(
                    item.affiliationStartYear,
                    item.affiliationEndYear,
                  )}
                </span>
              </TableCell>
              <TableCell className="text-center align-top">
                <div className="flex justify-center gap-2">
                  <UpdateUserAffiliation
                    userAffiliationId={item.id}
                    userAffiliation={item}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="action">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete User Affiliation
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the affiliation for{' '}
                          {item.affiliation.name}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel variant="outline">
                          CANCEL
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          {deleteMutation.isPending ? (
                            <Loader className="size-4" />
                          ) : (
                            'DELETE'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
