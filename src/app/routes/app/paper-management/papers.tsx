import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { getPapersQueryOptions } from '@/features/paper-management/api/get-papers';
import { CreatePaper } from '@/features/paper-management/components/create-paper';
import { PapersFilter } from '@/features/paper-management/components/papers-filter';
import { PapersList } from '@/features/paper-management/components/papers-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const title = url.searchParams.get('title') || undefined;
    const abstract = url.searchParams.get('abstract') || undefined;
    const doi = url.searchParams.get('doi') || undefined;
    const status = url.searchParams.get('status')
      ? Number(url.searchParams.get('status'))
      : undefined;
    const fromDate = url.searchParams.get('fromDate') || undefined;
    const toDate = url.searchParams.get('toDate') || undefined;
    const paperType = url.searchParams.get('paperType') || undefined;
    const journalName = url.searchParams.get('journalName') || undefined;
    const conferenceName = url.searchParams.get('conferenceName') || undefined;
    const isDeleted = url.searchParams.get('isDeleted') === 'true';

    const query = getPapersQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Title: title,
      Abstract: abstract,
      Doi: doi,
      Status: status,
      FromPublicationDate: fromDate,
      ToPublicationDate: toDate,
      PaperType: paperType,
      JournalName: journalName,
      ConferenceName: conferenceName,
      IsDeleted: isDeleted,
    });

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const PapersRoute = () => {
  return (
    <ContentLayout
      title="Paper Management"
      description="Manage research papers"
    >
      <div className="flex justify-end">
        <CreatePaper />
      </div>
      <div className="mt-4">
        <PapersFilter />
      </div>
      <div className="mt-4">
        <PapersList />
      </div>
    </ContentLayout>
  );
};

export default PapersRoute;
