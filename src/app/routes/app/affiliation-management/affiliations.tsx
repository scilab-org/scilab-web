import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getAffiliationsQueryOptions } from '@/features/affiliation-management/api/get-affiliations';
import { CreateAffiliation } from '@/features/affiliation-management/components/create-affiliation';
import { AffiliationsFilter } from '@/features/affiliation-management/components/affiliations-filter';
import { AffiliationsList } from '@/features/affiliation-management/components/affiliations-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;

    const query = getAffiliationsQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Name: name,
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

const AffiliationsRoute = () => {
  return (
    <>
      <Head title="Affiliation Management" />
      <ContentLayout
        title="Affiliation Management"
        description="Manage institution affiliations"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateAffiliation />
          </div>
          <AffiliationsFilter />
        </div>
        <div className="mt-4">
          <AffiliationsList />
        </div>
      </ContentLayout>
    </>
  );
};

export default AffiliationsRoute;
