import { QueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getPaperTemplateQueryOptions,
  usePaperTemplate,
} from '@/features/paper-template-management/api/get-paper-template';
import { UpdatePaperTemplate } from '@/features/paper-template-management/components/update-paper-template';
import { DeletePaperTemplate } from '@/features/paper-template-management/components/delete-paper-template';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const templateId = params.templateId as string;
    const query = getPaperTemplateQueryOptions(templateId);
    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const PaperTemplateRoute = () => {
  const params = useParams();
  const templateId = params.templateId as string;

  const templateQuery = usePaperTemplate({ id: templateId });

  if (templateQuery.isLoading) {
    return (
      <ContentLayout title="Template Detail">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ContentLayout>
    );
  }

  const template = templateQuery.data?.result?.template;

  if (!template) {
    return (
      <ContentLayout title="Template Not Found">
        <p className="text-muted-foreground">
          The requested template could not be found.
        </p>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={template.code}>
      <Card className="overflow-hidden rounded-xl border py-0 shadow-sm">
        <CardContent className="space-y-6 bg-[#fffaf1] p-6">
          {/* Actions bar */}
          <div className="flex items-center justify-end gap-2">
            <UpdatePaperTemplate template={template} />
            <DeletePaperTemplate id={template.id} />
          </div>

          <div className="bg-border/60 h-px" />

          {/* Description */}
          <div className="bg-card space-y-3 rounded-xl border p-5">
            <h2 className="text-xl font-semibold">Description</h2>
            <div className="border-t pt-4">
              <p className="text-foreground text-base leading-relaxed">
                {template.description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-card space-y-3 rounded-xl border p-5">
            <h2 className="text-xl font-semibold">
              Sections ({template.sections?.length ?? 0})
            </h2>
            <div className="divide-y border-t">
              {template.sections?.map((section) => (
                <div
                  key={section.displayOrder}
                  className="grid grid-cols-[2rem_1fr] gap-2 py-4 text-sm"
                >
                  <span className="text-muted-foreground pt-0.5 font-sans text-xs">
                    {section.displayOrder}.
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-base font-semibold">
                      {section.title}
                    </span>
                    {section.sectionRule && (
                      <span className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {section.sectionRule}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
};

export default PaperTemplateRoute;
