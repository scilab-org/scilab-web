import { QueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { Skeleton } from '@/components/ui/skeleton';
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

const PaperRoute = () => {
  const params = useParams();
  const paperId = params.paperId as string;
  const paperQuery = usePaperDetail({
    paperId,
    queryConfig: { refetchOnMount: 'always' },
  });

  if (paperQuery.isLoading) {
    return (
      <ContentLayout title="Paper Details">
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
      <ContentLayout title="Paper Not Found">
        <p className="text-muted-foreground">
          The requested paper could not be found.
        </p>
      </ContentLayout>
    );
  }

  return (
    <>
      <Head title="Paper Details" />
      <ContentLayout title={paper.title || 'Paper Details'}>
        <PaperView paperId={paperId} />
      </ContentLayout>
    </>
  );
};

export default PaperRoute;
