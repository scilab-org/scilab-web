import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getGapTypesQueryOptions } from '@/features/gap-type-management/api/get-gap-types';
import { CreateGapType } from '@/features/gap-type-management/components/create-gap-type';
import { GapTypesFilter } from '@/features/gap-type-management/components/gap-types-filter';
import { GapTypesList } from '@/features/gap-type-management/components/gap-types-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const isDeleted = url.searchParams.get('isDeleted') === 'true';

    const query = getGapTypesQueryOptions({
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
      return null;
    }
  };

const GapTypesRoute = () => {
  return (
    <>
      <Head title="Gap Type Management" />
      <ContentLayout
        title="Gap Type Management"
        description="Manage research gap types"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateGapType />
          </div>
          <GapTypesFilter />
        </div>
        <div className="mt-4">
          <GapTypesList />
        </div>
      </ContentLayout>
    </>
  );
};

export default GapTypesRoute;
