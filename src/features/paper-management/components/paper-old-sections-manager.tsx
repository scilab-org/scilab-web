import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Layers, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BTN } from '@/lib/button-styles';
import { cn } from '@/utils/cn';
import { useMarkSectionVersions } from '../api/get-mark-section-versions';
import { MarkSectionItem, MarkSectionVersionItem } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('vi-VN');
};

// ─── Main component ───────────────────────────────────────────────────────────

export const PaperOldSectionsManager = ({
  markSectionId,
  onViewSection: onExternalViewSection,
}: {
  paperId?: string;
  paperTitle?: string;
  markSectionId?: string | null;
  onViewSection?: (item: MarkSectionItem) => void;
}) => {
  const [viewingItem, setViewingItem] = useState<{
    title: string;
    content: string;
    versionLabel?: string;
  } | null>(null);

  const query = useMarkSectionVersions({
    markSectionId: markSectionId ?? null,
  });

  useEffect(() => {
    if (markSectionId) void query.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markSectionId]);

  const items = query.data?.result?.items ?? [];

  const handleView = (item: MarkSectionVersionItem) => {
    if (onExternalViewSection) {
      onExternalViewSection({
        sectionId: item.id,
        markSectionId: markSectionId ?? item.id,
        memberId: '',
        sectionRole: item.sectionRole || '',
        title: item.title,
        name: `${item.version} · ${item.title}`,
        email: '',
        isMainSection: item.isMainSection,
        isOldMainSection: item.isOldMainSection,
        parentSectionId: null,
        previousVersionSectionId: null,
        nextVersionSectionId: null,
        content: item.content || '',
      });
    } else {
      setViewingItem({
        title: item.title,
        content: item.content || '',
        versionLabel: item.version,
      });
    }
  };

  if (viewingItem) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-border bg-background flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewingItem(null)}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{viewingItem.title}</span>
            {viewingItem.versionLabel && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {viewingItem.versionLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="min-h-50 rounded-lg bg-slate-900 p-4 font-sans text-xs wrap-break-word whitespace-pre-wrap text-green-400 dark:bg-slate-950">
            {viewingItem.content || '(No content)'}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-border bg-muted/30 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Layers className="text-primary h-4 w-4" />
            </div>
            <div>
              <h3 className="text-foreground text-sm font-semibold">
                Section Versions
              </h3>
              {!query.isLoading && (
                <p className="text-muted-foreground text-[11px]">
                  {items.length} version{items.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
            title="Refresh"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', query.isFetching && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background overflow-x-auto">
        {!markSectionId ? (
          <div className="py-16 text-center">
            <Layers className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-muted-foreground text-sm">
              Select a section to view its versions.
            </p>
          </div>
        ) : query.isLoading || query.isFetching ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : query.isError ? (
          <div className="py-16 text-center">
            <Layers className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-muted-foreground text-sm">
              Failed to load versions.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-muted-foreground text-sm">No versions found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <TableHead className="w-10 text-center font-semibold text-green-900 dark:text-green-200">
                  #
                </TableHead>
                <TableHead className="font-semibold text-green-900 dark:text-green-200">
                  Version
                </TableHead>
                <TableHead className="w-24 font-semibold text-green-900 dark:text-green-200">
                  Created
                </TableHead>
                <TableHead className="w-24 font-semibold text-green-900 dark:text-green-200">
                  Modified
                </TableHead>
                <TableHead className="w-20 text-center font-semibold text-green-900 dark:text-green-200">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    'transition-colors',
                    idx % 2 === 0
                      ? 'bg-editor-content-bg dark:bg-transparent'
                      : 'bg-editor-bg/50 dark:bg-slate-900/20',
                  )}
                >
                  <TableCell className="text-center text-sm font-semibold">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground text-sm font-medium">
                        {item.version || '—'}
                      </span>
                      {item.isOldMainSection && (
                        <span className="w-fit rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          main
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDisplayDate(item.createdOnUtc)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDisplayDate(item.lastModifiedOnUtc)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(item)}
                      className={cn(
                        'flex h-7 items-center gap-1 px-2 text-xs',
                        BTN.VIEW_OUTLINE,
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
