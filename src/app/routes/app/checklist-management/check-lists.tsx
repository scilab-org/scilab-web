import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getCheckListsQueryOptions } from '@/features/checklist-management/api/get-checklists';
import { CreateCheckList } from '@/features/checklist-management/components/create-checklist';
import { CheckListsFilter } from '@/features/checklist-management/components/checklists-filter';
import { CheckListsList } from '@/features/checklist-management/components/checklists-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const section = url.searchParams.get('section') || undefined;
    const ruleName = url.searchParams.get('ruleName') || undefined;
    const item = url.searchParams.get('item') || undefined;
    const weightParam = url.searchParams.get('weight');
    const weight =
      weightParam !== null && weightParam !== ''
        ? Number(weightParam)
        : undefined;

    const query = getCheckListsQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Section: section,
      RuleName: ruleName,
      Item: item,
      Weight: weight,
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

const CheckListsRoute = () => {
  return (
    <>
      <Head title="Check List Management" />
      <ContentLayout
        title="Check List Management"
        description="Manage system check lists"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateCheckList />
          </div>
          <CheckListsFilter />
        </div>
        <div className="mt-4">
          <CheckListsList />
        </div>
      </ContentLayout>
    </>
  );
};

export default CheckListsRoute;
