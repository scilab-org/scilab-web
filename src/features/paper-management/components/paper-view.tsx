import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { usePaperDetail } from '../api/get-paper';
import { UpdatePaper } from './update-paper';
import { DeletePaper } from './delete-paper';
import { PAPER_STATUS_MAP } from '../constants';

const getStatusVariant = (
  status: number,
): {
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
  className?: string;
} => {
  switch (status) {
    case 1:
      return { variant: 'secondary' };
    case 2:
      return {
        variant: 'default',
        className: 'bg-blue-600 text-white hover:bg-blue-700',
      };
    case 3:
      return {
        variant: 'default',
        className: 'bg-amber-500 text-white hover:bg-amber-600',
      };
    case 4:
      return { variant: 'success' };
    default:
      return { variant: 'outline' };
  }
};

export const PaperView = ({ paperId }: { paperId: string }) => {
  const paperQuery = usePaperDetail({ paperId });

  if (paperQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const paper = paperQuery.data?.result?.paper;

  if (!paper) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={getStatusVariant(paper.status).variant}
            className={getStatusVariant(paper.status).className}
          >
            {PAPER_STATUS_MAP[paper.status] || 'Unknown'}
          </Badge>
          {paper.filePath && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={paper.filePath}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="size-4" />
                View PDF
              </a>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <UpdatePaper paperId={paperId} paper={paper} />
          <DeletePaper paperId={paperId} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paper Information</CardTitle>
            <CardDescription>Basic paper details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Title</p>
              <p className="font-medium">{paper.title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">DOI</p>
              <p className="font-medium">{paper.doi || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Paper Type</p>
              <p className="font-medium">{paper.paperType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Publication Date</p>
              <p className="font-medium">
                {paper.publicationDate
                  ? new Date(paper.publicationDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publication Details</CardTitle>
            <CardDescription>
              Journal and conference information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Journal Name</p>
              <p className="font-medium">{paper.journalName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Conference Name</p>
              <p className="font-medium">{paper.conferenceName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Created</p>
              <p className="font-medium">
                {paper.createdOnUtc
                  ? new Date(paper.createdOnUtc).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last Modified</p>
              <p className="font-medium">
                {paper.lastModifiedOnUtc
                  ? new Date(paper.lastModifiedOnUtc).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abstract</CardTitle>
          <CardDescription>Paper abstract</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {paper.abstract || 'No abstract available.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
