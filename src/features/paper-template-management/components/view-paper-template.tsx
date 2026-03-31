import * as React from 'react';
import { Eye, GitBranch, Lock } from 'lucide-react';

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
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{template.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Code</p>
                  <Badge variant="outline">{template.code}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Template Code</p>
                  <p className="font-mono text-xs">
                    {template.templateStructure?.templateCode || '—'}
                  </p>
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
                  Sections ({template.templateStructure?.sections?.length ?? 0})
                </p>
                <div className="rounded-lg border">
                  {/* Header */}
                  <div className="bg-muted/50 grid grid-cols-[3rem_1fr_auto] items-center gap-2 border-b px-3 py-2 text-xs font-medium text-gray-500">
                    <span>#</span>
                    <span>Title</span>
                    <span>Flags</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y">
                    {(() => {
                      let mainNum = 0;
                      return template.templateStructure?.sections?.map(
                        (section) => {
                          let displayPrefix = '';
                          if (section.numbered) {
                            mainNum++;
                            displayPrefix = `${mainNum}.`;
                          }
                          return (
                            <div
                              key={section.key}
                              className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 px-3 py-2 text-sm"
                            >
                              <span className="text-muted-foreground font-mono text-xs">
                                {displayPrefix || '—'}
                              </span>
                              <div className="flex flex-col gap-0.5 py-1">
                                <span>{section.title}</span>
                                {section.description && (
                                  <span className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                                    {section.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {section.required && (
                                  <Badge
                                    variant="default"
                                    className="h-5 bg-red-100 px-1.5 text-[10px] text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                  >
                                    Required
                                  </Badge>
                                )}
                                {section.allowSubsections ? (
                                  <span
                                    title="Subsections allowed"
                                    className="text-blue-500"
                                  >
                                    <GitBranch className="size-3.5" />
                                  </span>
                                ) : (
                                  <span
                                    title="No subsections"
                                    className="text-muted-foreground"
                                  >
                                    <Lock className="size-3.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        },
                      );
                    })()}
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
