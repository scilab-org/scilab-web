import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { getJournalsQueryOptions } from '@/features/journal-management/api/get-journals';
import { CreateJournal } from '@/features/journal-management/components/create-journal';
import { JournalsFilter } from '@/features/journal-management/components/journals-filter';
import { JournalsList } from '@/features/journal-management/components/journals-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const isDeleted = url.searchParams.get('isDeleted') === 'true';

    const query = getJournalsQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Name: name,
      IsDeleted: isDeleted,
    });

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      // Return null if query fails, component will handle the error
      return null;
    }
  };

const JournalsRoute = () => {
  return (
    <ContentLayout title="Journals">
      <JournalsList />
    </ContentLayout>
  );
};

export default JournalsRoute;
