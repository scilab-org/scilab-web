import * as React from 'react';
import { Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { BTN } from '@/lib/button-styles';
import { usePaperTemplate } from '../api/get-paper-template';

type ViewPaperTemplateProps = {
  id: string;
  name: string;
};

export const ViewPaperTemplate = ({ id, name }: ViewPaperTemplateProps) => {
  const [open, setOpen] = React.useState(false);

  const templateQuery = usePaperTemplate({
    id,
    queryConfig: { enabled: open },
  });

  const template = templateQuery.data?.result?.template;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={BTN.VIEW_OUTLINE}>
          <Eye className="size-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Template Detail</SheetTitle>
          <SheetDescription>{name}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {templateQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !template ? (
            <p className="text-muted-foreground text-sm">
              Failed to load template.
            </p>
          ) : (
            <>
              {/* Info */}
              <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Code</p>
                  <Badge variant="outline">{template.code}</Badge>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs">Description</p>
                  <p>{template.description || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="text-xs">
                    {new Date(template.createdOnUtc).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Sections ({template.sections?.length ?? 0})
                </p>
                <div className="rounded-lg border">
                  {/* Header */}
                  <div className="bg-muted/50 grid grid-cols-[2rem_1fr] items-center gap-2 border-b px-3 py-2 text-xs font-medium text-gray-500">
                    <span>#</span>
                    <span>Title / Rule</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y">
                    {template.sections?.map((section) => (
                      <div
                        key={section.displayOrder}
                        className="grid grid-cols-[2rem_1fr] gap-2 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground pt-0.5 font-sans text-xs">
                          {section.displayOrder}.
                        </span>
                        <div className="flex flex-col gap-0.5 py-0.5">
                          <span className="font-medium">{section.title}</span>
                          {section.sectionRule && (
                            <span className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                              {section.sectionRule}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
