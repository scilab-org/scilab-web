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

import { UserRecentPaper } from '../types';

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

type RecentUserPapersTableProps = {
  papers: UserRecentPaper[];
};

export const RecentUserPapersTable = ({
  papers,
}: RecentUserPapersTableProps) => (
  <Card className="gap-0">
    <CardHeader className="flex-row items-center justify-between border-b px-5 pt-5 pb-4">
      <CardTitle className="text-sm font-medium">Recent Papers</CardTitle>
      <Link
        to={paths.app.myAssignedPapers.getHref()}
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
                  {paper.projectId ? (
                    <Link
                      to={`${paths.app.assignedProjects.paperDetail.getHref(paper.projectId, paper.id)}?tab=overview`}
                      className="hover:text-primary line-clamp-2 transition-colors"
                    >
                      {paper.title}
                    </Link>
                  ) : (
                    <span className="line-clamp-2">{paper.title}</span>
                  )}
                  {paper.conferenceJournalName && (
                    <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                      {paper.conferenceJournalName}
                    </span>
                  )}
                </TableCell>
                <TableCell className="w-36 text-right align-top">
                  <Badge variant="outline" className="text-xs">
                    {SUBMISSION_STATUS[paper.submissionStatus ?? 1] ?? '—'}
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

export const RecentUserPapersTableSkeleton = () => (
  <Card className="gap-0">
    <CardHeader className="flex-row items-center justify-between border-b px-5 pt-5 pb-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-16" />
    </CardHeader>
    <CardContent className="p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b px-5 py-3 last:border-0"
        >
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </CardContent>
  </Card>
);
