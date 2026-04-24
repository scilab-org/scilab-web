import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getDomainsQueryOptions } from '@/features/domain-management/api/get-domains';
import { CreateDomain } from '@/features/domain-management/components/create-domain';
import { DomainsFilter } from '@/features/domain-management/components/domains-filter';
import { DomainsList } from '@/features/domain-management/components/domains-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;

    const query = getDomainsQueryOptions({
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

const DomainsRoute = () => {
  return (
    <>
      <Head title="Domain Management" />
      <ContentLayout
        title="Domain Management"
        description="Manage system domains"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateDomain />
          </div>
          <DomainsFilter />
        </div>
        <div className="mt-4">
          <DomainsList />
        </div>
      </ContentLayout>
    </>
  );
};

export default DomainsRoute;
