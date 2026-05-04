import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { useCheckList } from '../api/get-checklist';

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'N/A';

export const ViewCheckList = ({ checkListId }: { checkListId: string }) => {
  const [open, setOpen] = React.useState(false);

  const checkListQuery = useCheckList({
    checkListId,
    queryConfig: {
      enabled: open,
    },
  });

  const checkList = checkListQuery.data?.result.checkList;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction">VIEW</Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>
              {checkList ? (
                <span className="flex items-center gap-2">
                  {checkList.section} Check List
                  <span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                    {checkList.items.length}
                  </span>
                </span>
              ) : (
                'Check List Detail'
              )}
            </DialogTitle>
            <DialogDescription>
              View section, items, and audit information for this check list.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="scrollbar-dialog flex-1 overflow-y-auto px-6 py-4">
          {checkListQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : checkListQuery.isError || !checkList ? (
            <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-sm">
              Failed to load checklist detail.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 rounded-md border bg-[#fffaf1] p-4 xl:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Created By
                  </p>
                  <p className="font-medium">{checkList.createdBy || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Created At
                  </p>
                  <p className="font-medium">
                    {formatDateTime(checkList.createdOnUtc)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Last Modified By
                  </p>
                  <p className="font-medium">
                    {checkList.lastModifiedBy || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Last Modified At
                  </p>
                  <p className="font-medium">
                    {formatDateTime(checkList.lastModifiedOnUtc)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {checkList.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-muted/20 space-y-2 rounded-md border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground flex w-5 shrink-0 items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="border-input flex h-9 flex-1 items-center rounded-md border bg-transparent px-3 text-sm">
                        {item.name}
                      </span>
                      <span className="border-input flex h-9 w-24 shrink-0 items-center rounded-md border bg-transparent px-3 text-sm">
                        {item.weight}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 shrink-0" />
                      <p className="border-input min-h-16 flex-1 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-pre-wrap">
                        {item.rule}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
