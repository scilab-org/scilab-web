import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { getPaperTemplatesQueryOptions } from '@/features/paper-template-management/api/get-paper-templates';
import { CreatePaperTemplate } from '@/features/paper-template-management/components/create-paper-template';
import { PaperTemplatesFilter } from '@/features/paper-template-management/components/paper-templates-filter';
import { PaperTemplatesList } from '@/features/paper-template-management/components/paper-templates-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const name = url.searchParams.get('name') || undefined;
    const code = url.searchParams.get('code') || undefined;

    const query = getPaperTemplatesQueryOptions({
      PageNumber: page,
      PageSize: 10,
      Description: name,
      Code: code,
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

const PaperTemplatesRoute = () => {
  return (
    <>
      <Head title="Paper Templates" />
      <ContentLayout
        title="Paper Templates"
        description="Manage paper structure templates"
      >
        <div className="flex justify-end">
          <CreatePaperTemplate />
        </div>
        <div className="mt-4">
          <PaperTemplatesFilter />
        </div>
        <div className="mt-4">
          <PaperTemplatesList />
        </div>
      </ContentLayout>
    </>
  );
};

export default PaperTemplatesRoute;
