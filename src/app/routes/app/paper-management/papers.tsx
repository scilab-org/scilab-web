import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
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
    const publisher = url.searchParams.get('publisher') || undefined;
    const abstract = url.searchParams.get('abstract') || undefined;
    const doi = url.searchParams.get('doi') || undefined;
    const fromDate = url.searchParams.get('fromDate') || undefined;
    const toDate = url.searchParams.get('toDate') || undefined;
    const paperType = url.searchParams.get('paperType') || undefined;
    const journalId = url.searchParams.get('journalId') || undefined;
    const ranking = url.searchParams.get('ranking') || undefined;
    const authors = url.searchParams.getAll('author').length
      ? url.searchParams.getAll('author')
      : undefined;
    const keywords = url.searchParams.getAll('keyword').length
      ? url.searchParams.getAll('keyword')
      : undefined;
    const isDeleted = url.searchParams.get('isDeleted') === 'true';

    const query = getPapersQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Title: title,
      Publisher: publisher,
      Abstract: abstract,
      Doi: doi,
      FromPublicationDate: fromDate,
      ToPublicationDate: toDate,
      PaperType: paperType,
      JournalId: journalId,
      Ranking: ranking,
      Author: authors,
      Keyword: keywords,
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
    <>
      <Head title="Paper Bank" />
      <ContentLayout
        title="Paper Bank Management"
        description="Manage research paper banks"
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
    </>
  );
};

export default PapersRoute;
