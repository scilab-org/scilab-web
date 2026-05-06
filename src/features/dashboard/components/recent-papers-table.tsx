import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';

import { RecentPaper } from '../types';

const SUBMISSION_STATUS: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'Revision Required',
  4: 'Resubmitted',
  5: 'Accepted',
  6: 'Published',
  7: 'Rejected',
  8: 'On Hold',
};

type RecentPapersTableProps = {
  papers: RecentPaper[];
};

export const RecentPapersTable = ({ papers }: RecentPapersTableProps) => (
  <Card className="gap-0">
    <CardHeader className="flex-row items-center justify-between border-b px-5 pt-5 pb-4">
      <CardTitle className="text-sm font-medium">Recent Papers</CardTitle>
      <Link
        to={paths.app.paperManagement.papers.getHref()}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        View more
      </Link>
    </CardHeader>
    <CardContent className="overflow-hidden p-0">
      {papers.length === 0 ? (
        <p className="text-muted-foreground px-5 py-8 text-center text-xs">
          No papers yet
        </p>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-36 text-right">Submission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell className="align-top font-medium">
                  <Link
                    to={`${paths.app.projectPaperDetail.getHref(paper.projectId, paper.id)}?tab=overview`}
                    className="hover:text-primary line-clamp-2 transition-colors"
                  >
                    {paper.title}
                  </Link>
                </TableCell>
                <TableCell className="w-36 text-right align-top">
                  <Badge variant="outline" className="text-xs">
                    {SUBMISSION_STATUS[paper.status ?? 1] ?? '—'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const RecentPapersTableSkeleton = () => (
  <Card className="gap-0">
    <CardHeader className="border-b px-5 pt-5 pb-4">
      <Skeleton className="h-4 w-28" />
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="text-right">Submission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-44" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-5 w-20 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
