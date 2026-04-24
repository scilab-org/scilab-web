import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
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
    const templateId = url.searchParams.get('templateId') || undefined;
    const isDeleted = url.searchParams.get('isDeleted') === 'true';

    const query = getJournalsQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Name: name,
      TemplateId: templateId,
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
    <>
      <Head title="Journals" />
      <ContentLayout
        title="Journals"
        description="Manage and organize journal templates and writing styles"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateJournal />
          </div>
          <JournalsFilter />
        </div>

        <div className="mt-4">
          <JournalsList />
        </div>
      </ContentLayout>
    </>
  );
};

export default JournalsRoute;
