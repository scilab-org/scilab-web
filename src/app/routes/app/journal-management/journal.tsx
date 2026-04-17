import { QueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useJournal,
  getJournalQueryOptions,
} from '@/features/journal-management/api/get-journal';
import { ViewJournal } from '@/features/journal-management/components/view-journal';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const journalId = params.journalId as string;

    const query = getJournalQueryOptions(journalId);

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const JournalRoute = () => {
  const params = useParams();
  const journalId = params.journalId as string;
  const journalQuery = useJournal({ journalId });

  if (journalQuery.isLoading) {
    return (
      <ContentLayout title="Journal Details">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ContentLayout>
    );
  }

  const journal = journalQuery.data?.result?.journal;
  const projects = journalQuery.data?.result?.projects;
  const papers = journalQuery.data?.result?.papers;

  if (!journal) {
    return (
      <ContentLayout title="Journal Not Found">
        <p className="text-muted-foreground">
          The requested journal could not be found.
        </p>
      </ContentLayout>
    );
  }

  return (
    <>
      <Head title="Journal Details" />
      <ContentLayout title={journal.name || 'Journal Details'}>
        <ViewJournal journal={journal} projects={projects} papers={papers} />
      </ContentLayout>
    </>
  );
};

export default JournalRoute;
