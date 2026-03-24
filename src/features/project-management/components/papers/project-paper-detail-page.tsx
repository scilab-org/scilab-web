import { useNavigate } from 'react-router';
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { PaperSectionsManager } from '@/features/paper-management/components/paper-sections-manager';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';

// Helper to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ProjectPaperDetailPage = ({
  projectId,
  paperId,
  isAuthor = false,
  isManager = false,
  backPath,
}: {
  projectId: string;
  paperId: string;
  isAuthor?: boolean;
  isManager?: boolean;
  backPath: string;
}) => {
  const navigate = useNavigate();
  const paperQuery = useWritingPaperDetail({ paperId });

  if (paperQuery.isLoading) {
    return (
      <ContentLayout title="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </ContentLayout>
    );
  }

  const paper = paperQuery.data?.result?.paper;
  const paperType = paper?.paperType?.trim();

  if (!paper) {
    return (
      <ContentLayout title="Paper Not Found">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Paper not found</p>
          <Button onClick={() => navigate(backPath)} className="mt-4">
            Go Back
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={paper.title || 'Untitled Paper'}>
      <div className="space-y-6">
        {/* Paper Info Card */}
        <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
          {/* Header: Title, Status, Type */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">
                {paper.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {paperType && <Badge variant="outline">{paperType}</Badge>}
                <Badge
                  className={
                    paper.status === 1
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      : paper.status === 2
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        : paper.status === 3
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                  }
                >
                  {PAPER_STATUS_MAP[paper.status] || 'Unknown'}
                </Badge>
                {paper.template && (
                  <Badge variant="secondary">{paper.template}</Badge>
                )}
              </div>
            </div>
            <div className="text-muted-foreground space-y-1 text-right text-sm">
              {paper.createdBy && (
                <div className="flex items-center justify-end gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Created by {paper.createdBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-foreground font-semibold">Abstract</h3>
                <p className="text-muted-foreground bg-muted/30 mt-1 rounded-md p-3 text-sm whitespace-pre-wrap">
                  {paper.abstract || 'No abstract'}
                </p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Context</h3>
                <p className="text-muted-foreground bg-muted/30 mt-1 rounded-md p-3 text-sm whitespace-pre-wrap">
                  {paper.context || 'No context'}
                </p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Research Gap</h3>
                <p className="text-muted-foreground bg-muted/30 mt-1 rounded-md p-3 text-sm whitespace-pre-wrap">
                  {paper.researchGap || 'No research gap'}
                </p>
                {paper.gapType && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Type: {paper.gapType}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-foreground font-semibold">
                  Main Contribution
                </h3>
                <p className="text-muted-foreground bg-muted/30 mt-1 rounded-md p-3 text-sm whitespace-pre-wrap">
                  {paper.mainContribution || 'No contribution listed'}
                </p>
              </div>
              {(paper.journalName || paper.journal) && (
                <div>
                  <h3 className="text-foreground font-semibold">Journal</h3>
                  {paper.journalName && (
                    <p className="text-muted-foreground bg-muted/30 mt-1 mb-2 rounded-md p-3 text-sm whitespace-pre-wrap">
                      {paper.journalName}
                    </p>
                  )}
                  {paper.journal && paper.journal !== paper.journalName && (
                    <p className="text-muted-foreground bg-muted/30 mt-1 rounded-md p-3 text-sm whitespace-pre-wrap">
                      {paper.journal}
                    </p>
                  )}
                </div>
              )}
              {(paper.styleName || paper.styleDescription) && (
                <div>
                  <h3 className="text-foreground font-semibold">
                    Style Guidelines
                  </h3>
                  <div className="text-muted-foreground bg-muted/30 mt-1 space-y-2 rounded-md p-3 text-sm">
                    {paper.styleName && (
                      <p className="font-medium">{paper.styleName}</p>
                    )}
                    {paper.styleDescription && <p>{paper.styleDescription}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sections Manager */}
        <div>
          <PaperSectionsManager
            paperId={paperId}
            paperTitle={paper.title || 'Untitled'}
            subProjectId={paper.subProjectId || projectId}
            isAuthor={isAuthor}
            isManager={isManager}
          />
        </div>
      </div>
    </ContentLayout>
  );
};
