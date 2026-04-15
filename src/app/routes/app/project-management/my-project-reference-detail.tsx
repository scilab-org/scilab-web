import { QueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  usePaperDetail,
  getPaperQueryOptions,
} from '@/features/paper-management/api/get-paper';
import { PaperView } from '@/features/paper-management/components/paper-view';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const paperId = params.paperId as string;

    const query = getPaperQueryOptions(paperId);

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const MyProjectReferenceDetailRoute = () => {
  const params = useParams();
  const navigate = useNavigate();
  const paperId = params.paperId as string;
  const paperQuery = usePaperDetail({ paperId });

  if (paperQuery.isLoading) {
    return (
      <ContentLayout title="Reference Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ContentLayout>
    );
  }

  const paper = paperQuery.data?.result?.paperBank;

  if (!paper) {
    return (
      <ContentLayout title="Reference Not Found">
        <p className="text-muted-foreground">
          The requested reference could not be found.
        </p>
      </ContentLayout>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <Button
          variant="ghost"
          className="text-muted-foreground -ml-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
      </div>
      <ContentLayout title={paper.title || 'Reference Details'}>
        <PaperView paperId={paperId} />
      </ContentLayout>
    </div>
  );
};

export default MyProjectReferenceDetailRoute;
