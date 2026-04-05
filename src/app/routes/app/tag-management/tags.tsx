import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { getTagsQueryOptions } from '@/features/tag-management/api/get-tags';
import { CreateTag } from '@/features/tag-management/components/create-tag';
import { TagsFilter } from '@/features/tag-management/components/tags-filter';
import { TagsList } from '@/features/tag-management/components/tags-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const isDeleted = url.searchParams.get('isDeleted') === 'true';

    const query = getTagsQueryOptions({
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

const TagsRoute = () => {
  return (
    <ContentLayout title="Tag Management" description="Manage tags">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <CreateTag />
        </div>
        <TagsFilter />
      </div>
      <div className="mt-4">
        <TagsList />
      </div>
    </ContentLayout>
  );
};

export default TagsRoute;
