import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

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
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';
import { useAssignedSectionsHistory } from '../api/get-assigned-sections-history';
import {
  getSectionHistory,
  useSectionHistory,
} from '../api/get-section-history';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { AssignedSectionHistoryItem, MarkSectionItem } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stripLatex = (input: string): string => {
  if (!input) return '(Untitled)';
  let s = input;
  const cmdPat = /\\[a-zA-Z*]+\{([^{}]*)\}/g;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(cmdPat, '$1');
  }
  s = s
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\\^/g, '^')
    .replace(/\\~/g, '~')
    .replace(/\\-/g, '-')
    .replace(/\\\\/g, '');
  return s.replace(/[{}]/g, '').trim() || '(Untitled)';
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('vi-VN');
};

const isReadOnlyHistoryEntry = (sectionRole?: string) =>
  (sectionRole || '').trim().toLowerCase() === 'section:read';

// ─── Avatar cluster ───────────────────────────────────────────────────────────

const AvatarCluster = ({ items }: { items: MarkSectionItem[] }) => {
  const MAX_SHOW = 3;
  const shown = items.slice(0, MAX_SHOW);
  const extra = items.length - MAX_SHOW;
  const COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-rose-500',
  ];
  return (
    <div className="flex items-center">
      {shown.map((item, i) => {
        const initials = item.name
          ? item.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : '?';
        return (
          <div
            key={item.sectionId}
            title={item.name}
            style={{ zIndex: shown.length - i, marginLeft: i === 0 ? 0 : -8 }}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white dark:border-slate-900',
              COLORS[i % COLORS.length],
            )}
          >
            {initials}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          style={{ marginLeft: -8 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-[9px] font-bold text-white dark:border-slate-900"
        >
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── Lazy contributor avatar cell ─────────────────────────────────────────────

const ContributorCell = ({ markSectionId }: { markSectionId: string }) => {
  const query = useSectionHistory({ markSectionId });
  const items = query.data?.result?.items ?? [];
  if (query.isLoading) return <Skeleton className="h-7 w-16 rounded-full" />;
  if (items.length === 0)
    return <span className="text-muted-foreground text-xs">—</span>;
  return <AvatarCluster items={items} />;
};

// ─── Wrapper component for expanded contributor rows ────────────────────────────

const ExpandedVersionRows = ({
  markSectionId,
  currentUserEmail,
  onViewSection,
}: {
  markSectionId: string;
  currentUserEmail: string;
  onViewSection?: (item: MarkSectionItem) => void;
}) => {
  const query = useSectionHistory({ markSectionId });
  const items = query.data?.result?.items ?? [];

  if (query.isLoading) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell />
        <TableCell />
        <TableCell colSpan={5} className="py-2">
          <Skeleton className="h-7 w-full rounded-lg" />
        </TableCell>
      </TableRow>
    );
  }

  if (items.length === 0) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell />
        <TableCell />
        <TableCell colSpan={5} className="py-2">
          <span className="text-muted-foreground text-xs">No contributors</span>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {items.map((item) => {
        const initials = item.name
          ? item.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : '?';
        const isMe =
          (item.email || '').trim().toLowerCase() ===
          currentUserEmail.trim().toLowerCase();

        return (
          <TableRow
            key={`${markSectionId}-${item.sectionId}`}
            className="bg-blue-50/40 hover:bg-blue-100/40 dark:bg-blue-950/15 dark:hover:bg-blue-950/25"
          >
            {/* # */}
            <TableCell />
            {/* Version — vertical guideline */}
            <TableCell>
              <div className="mx-auto h-6 w-px rounded-full bg-blue-200 dark:bg-blue-800" />
            </TableCell>
            {/* Section — member info */}
            <TableCell>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-xs font-medium">
                      {item.name}
                    </span>
                    {isMe && (
                      <span className="rounded-full border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        me
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[10px]">
                    {item.email}
                  </p>
                </div>
              </div>
            </TableCell>
            {/* Created At */}
            <TableCell className="text-muted-foreground text-sm">
              {formatDisplayDate(item.createdOnUtc)}
            </TableCell>
            {/* Last Modified */}
            <TableCell className="text-muted-foreground text-sm">
              {formatDisplayDate(item.lastModifiedOnUtc)}
            </TableCell>
            {/* Contributors (empty for sub-rows) */}
            <TableCell />
            {/* Action */}
            <TableCell className="text-right">
              {onViewSection && (
                <button
                  type="button"
                  onClick={() => onViewSection(item)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800/30"
                >
                  <Eye className="h-2.5 w-2.5" />
                  View
                </button>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const PaperOldSectionsManager = ({
  paperId,
  paperTitle,
  onViewSection: onExternalViewSection,
}: {
  paperId: string;
  paperTitle: string;
  onViewSection?: (item: MarkSectionItem) => void;
}) => {
  const { data: user } = useUser();
  const currentUserEmail = (user?.email || '').trim().toLowerCase();
  const queryClient = useQueryClient();
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(),
  );
  const [viewingItem, setViewingItem] = useState<{
    title: string;
    content: string;
    versionLabel?: string;
    contributorName?: string;
  } | null>(null);
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  const historyQuery = useAssignedSectionsHistory({
    paperId,
    params: {
      PageNumber: 1,
      PageSize: 1000,
      FromDate: fromDateFilter || undefined,
      ToDate: toDateFilter || undefined,
    },
    queryConfig: { enabled: !!paperId },
  });

  // Always refetch when this component mounts (tab switched to Old Section)
  useEffect(() => {
    void historyQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oldSections = useMemo(
    () =>
      [...(historyQuery.data?.result?.items ?? [])].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder)
          return a.displayOrder - b.displayOrder;
        return stripLatex(a.title).localeCompare(stripLatex(b.title));
      }),
    [historyQuery.data?.result?.items],
  );

  const groupedOldSections = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        latest: AssignedSectionHistoryItem;
        versions: AssignedSectionHistoryItem[];
      }
    >();

    oldSections.forEach((section) => {
      const key = `${section.title}::${section.displayOrder}::${section.parentSectionId ?? ''}`;
      const current = groups.get(key);
      if (!current) {
        groups.set(key, { key, latest: section, versions: [section] });
        return;
      }
      current.versions.push(section);
      if (
        section.version > current.latest.version ||
        (section.version === current.latest.version &&
          new Date(
            section.lastModifiedOnUtc || section.createdOnUtc,
          ).getTime() >
            new Date(
              current.latest.lastModifiedOnUtc || current.latest.createdOnUtc,
            ).getTime())
      ) {
        current.latest = section;
      }
    });

    const result = Array.from(groups.values()).map((g) => ({
      ...g,
      // Descending: highest version first
      versions: [...g.versions].sort((a, b) => {
        if (b.version !== a.version) return b.version - a.version;
        return (
          new Date(b.lastModifiedOnUtc || b.createdOnUtc).getTime() -
          new Date(a.lastModifiedOnUtc || a.createdOnUtc).getTime()
        );
      }),
    }));

    result.sort((a, b) => {
      if (a.latest.displayOrder !== b.latest.displayOrder)
        return a.latest.displayOrder - b.latest.displayOrder;
      return stripLatex(a.latest.title).localeCompare(
        stripLatex(b.latest.title),
      );
    });

    return result;
  }, [oldSections]);

  const markSectionIdsToPrefetch = useMemo(() => {
    const ids = new Set<string>();
    groupedOldSections.forEach((group) =>
      group.versions.forEach((s) => ids.add(s.markSectionId || s.id)),
    );
    return Array.from(ids);
  }, [groupedOldSections]);

  useEffect(() => {
    if (markSectionIdsToPrefetch.length === 0) return;
    markSectionIdsToPrefetch.forEach((markSectionId) => {
      void queryClient.prefetchQuery({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.SECTION_HISTORY, markSectionId],
        queryFn: () => getSectionHistory(markSectionId),
      });
    });
  }, [markSectionIdsToPrefetch, queryClient]);

  const toggleVersionExpand = (id: string, markSectionId: string) => {
    void queryClient.invalidateQueries({
      queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.SECTION_HISTORY, markSectionId],
    });
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            {viewingItem.contributorName && (
              <span className="text-muted-foreground text-xs">
                by {viewingItem.contributorName}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="min-h-50 rounded-lg bg-slate-900 p-4 font-mono text-xs wrap-break-word whitespace-pre-wrap text-green-400 dark:bg-slate-950">
            {viewingItem.content || '(No content)'}
          </pre>
        </div>
      </div>
    );
  }

  const totalCount = groupedOldSections.length;
  const hasActiveFilters = !!(fromDateFilter || toDateFilter);

  return (
    <div className="border-border bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm">
      {/* Header + Filters */}
      <div className="border-border bg-muted/30 border-b px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Layers className="text-primary h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">
              Old Sections
            </h3>
          </div>
          <button
            type="button"
            onClick={() => void historyQuery.refetch()}
            disabled={historyQuery.isFetching}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5',
                historyQuery.isFetching && 'animate-spin',
              )}
            />
          </button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
          <input
            type="date"
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={fromDateFilter}
            onChange={(e) => setFromDateFilter(e.target.value)}
          />
          <input
            type="date"
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={toDateFilter}
            onChange={(e) => setToDateFilter(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasActiveFilters}
            onClick={() => {
              setFromDateFilter('');
              setToDateFilter('');
            }}
            className="h-9 w-fit justify-self-start px-3 md:justify-self-end"
          >
            Clear filters
          </Button>
        </div>
        {!historyQuery.isLoading && (
          <p className="text-muted-foreground mt-2 text-sm">
            {totalCount} section{totalCount !== 1 ? 's' : ''} in history
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-background overflow-x-auto">
        {historyQuery.isLoading || historyQuery.isFetching ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : historyQuery.isError ? (
          <div className="py-16 text-center">
            <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="text-muted-foreground text-sm font-medium">
              Failed to load old section history.
            </p>
          </div>
        ) : groupedOldSections.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="text-muted-foreground text-sm font-medium">
              No old sections found.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <TableHead className="w-12 text-center font-semibold text-green-900 dark:text-green-200">
                  #
                </TableHead>
                <TableHead className="w-20 font-semibold text-green-900 dark:text-green-200">
                  Version
                </TableHead>
                <TableHead className="font-semibold text-green-900 dark:text-green-200">
                  Section
                </TableHead>
                <TableHead className="w-28 font-semibold text-green-900 dark:text-green-200">
                  Created At
                </TableHead>
                <TableHead className="w-28 font-semibold text-green-900 dark:text-green-200">
                  Last Modified
                </TableHead>
                <TableHead className="w-32 font-semibold text-green-900 dark:text-green-200">
                  Contributors
                </TableHead>
                <TableHead className="w-24 text-right font-semibold text-green-900 dark:text-green-200">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                let rowIndex = 0;
                return groupedOldSections.flatMap((group, groupIdx) =>
                  group.versions.flatMap((version, versionIdx) => {
                    rowIndex++;
                    const currentRowIndex = rowIndex;
                    const subVersion = group.versions.length - versionIdx;
                    const versionNumber = `${groupIdx + 1}.${subVersion}`;
                    const isVersionReadOnly = isReadOnlyHistoryEntry(
                      version.sectionRole,
                    );
                    const isVersionExpanded = expandedVersions.has(version.id);
                    const markId = version.markSectionId || version.id;

                    const versionRow = (
                      <TableRow
                        key={version.id}
                        onClick={() => {
                          if (!isVersionReadOnly)
                            toggleVersionExpand(version.id, markId);
                        }}
                        className={cn(
                          'transition-colors',
                          groupIdx % 2 === 0
                            ? 'bg-white dark:bg-transparent'
                            : 'bg-slate-50/50 dark:bg-slate-900/20',
                          !isVersionReadOnly &&
                            'cursor-pointer hover:bg-green-50/60 dark:hover:bg-green-950/20',
                        )}
                      >
                        <TableCell className="text-center text-sm font-semibold">
                          {currentRowIndex}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                            {versionNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground text-sm">
                              {stripLatex(version.title)}
                            </span>
                            {version.isOldMainSection && (
                              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                main
                              </span>
                            )}
                            {!isVersionReadOnly &&
                              (isVersionExpanded ? (
                                <ChevronDown className="text-muted-foreground h-3 w-3 shrink-0" />
                              ) : (
                                <ChevronRight className="text-muted-foreground h-3 w-3 shrink-0" />
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDisplayDate(version.createdOnUtc)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDisplayDate(version.lastModifiedOnUtc)}
                        </TableCell>
                        <TableCell>
                          <ContributorCell markSectionId={markId} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onExternalViewSection) {
                                onExternalViewSection({
                                  sectionId: version.id,
                                  markSectionId:
                                    version.markSectionId || version.id,
                                  memberId: version.memberId,
                                  sectionRole: version.sectionRole || '',
                                  title: stripLatex(version.title),
                                  name: `v${versionNumber} · ${stripLatex(version.title)}`,
                                  email: '',
                                  isMainSection:
                                    version.isOldMainSection ??
                                    version.isMainSection,
                                  parentSectionId: version.parentSectionId,
                                  previousVersionSectionId: null,
                                  nextVersionSectionId: null,
                                  content: version.content || '',
                                });
                              } else {
                                setViewingItem({
                                  title: stripLatex(version.title),
                                  content: version.content || '',
                                  versionLabel: versionNumber,
                                });
                              }
                            }}
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
                    );

                    const contributorRows =
                      isVersionExpanded && !isVersionReadOnly
                        ? [
                            <ExpandedVersionRows
                              key={`${version.id}-expanded`}
                              markSectionId={markId}
                              currentUserEmail={currentUserEmail}
                              onViewSection={
                                onExternalViewSection
                                  ? onExternalViewSection
                                  : (item) => {
                                      setViewingItem({
                                        title: stripLatex(version.title),
                                        content: item.content || '',
                                        versionLabel: versionNumber,
                                        contributorName: item.name,
                                      });
                                    }
                              }
                            />,
                          ]
                        : [];

                    return [versionRow, ...contributorRows];
                  }),
                );
              })()}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
