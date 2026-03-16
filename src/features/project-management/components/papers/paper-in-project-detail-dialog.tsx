import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';

import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';
import { SubProjectPaper } from '../../types';

type PaperInProjectDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: SubProjectPaper | null;
};

const renderValue = (value: string | null | undefined) => {
  if (!value || !value.trim()) return '—';
  return value;
};

export const PaperInProjectDetailDialog = ({
  open,
  onOpenChange,
  paper,
}: PaperInProjectDetailDialogProps) => {
  const paperId = paper?.id ?? '';

  const detailQuery = useWritingPaperDetail({
    paperId,
    queryConfig: {
      enabled: open && !!paperId,
    },
  });

  const detail = detailQuery.data?.result?.paper;
  const title = detail?.title ?? paper?.title ?? '(Untitled)';
  const context = detail?.context ?? paper?.context;
  const template = detail?.template ?? paper?.template;
  const paperType = detail?.paperType ?? paper?.paperType;
  const status = detail?.status ?? paper?.status;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="bg-background fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border shadow-xl">
          <Dialog.Close className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-full p-1 transition-colors">
            <X className="size-4" />
          </Dialog.Close>

          <div className="border-border border-b px-6 py-4 pr-12">
            <Dialog.Title className="text-foreground text-lg font-semibold">
              {title}
            </Dialog.Title>
          </div>

          <div className="space-y-4 px-6 py-5">
            {detailQuery.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading paper detail...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Type</p>
                    <p className="text-sm font-medium">
                      {renderValue(paperType)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="text-sm font-medium">
                      {status != null
                        ? (PAPER_STATUS_MAP[status] ?? 'Unknown')
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Template</p>
                    <p className="text-sm font-medium">
                      {renderValue(template)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Context</p>
                  <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm whitespace-pre-wrap">
                    {renderValue(context)}
                  </div>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
