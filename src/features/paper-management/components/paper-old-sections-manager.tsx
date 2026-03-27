import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, Layers } from 'lucide-react';
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
import { LatexPaperEditor } from '@/features/project-management/components/papers/latex-paper-editor';

import { useAssignedSectionsHistory } from '../api/get-assigned-sections-history';
import { getMarkSection, useMarkSection } from '../api/get-mark-section';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { AssignedSectionHistoryItem, MarkSectionItem } from '../types';

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
  return parsed.toLocaleDateString('en-US');
};

const isReadOnlyHistoryEntry = (sectionRole?: string) =>
  (sectionRole || '').trim().toLowerCase() === 'section:read';

const SectionExpandedView = ({
  markSectionId,
  currentUserEmail,
  onViewSection,
}: {
  markSectionId: string;
  currentUserEmail?: string;
  onViewSection?: (item: MarkSectionItem) => void;
}) => {
  const query = useMarkSection({ markSectionId });

  if (query.isLoading) {
    return (
      <div className="space-y-1 px-3 py-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  const normalizedCurrentEmail = (currentUserEmail || '').trim().toLowerCase();
  const sorted = (query.data?.result?.items ?? [])
    .filter((item) => item.sectionId !== item.markSectionId)
    .sort((a, b) => {
      const getPriority = (item: MarkSectionItem) => {
        const isMain =
          item.isMainSection || item.sectionId === item.markSectionId;
        if (isMain && item.sectionRole === 'paper:author') return 0;
        if (isMain) return 1;
        if (item.sectionRole === 'paper:author') return 2;
        return 3;
      };

      return getPriority(a) - getPriority(b);
    });

  const preferredMainItem =
    sorted.find(
      (item) =>
        (item.isMainSection || item.sectionId === item.markSectionId) &&
        item.sectionRole === 'paper:author',
    ) ??
    sorted.find(
      (item) => item.isMainSection || item.sectionId === item.markSectionId,
    );

  if (sorted.length === 0) {
    return (
      <div className="text-muted-foreground px-3 py-2 text-center text-xs">
        No other versions
      </div>
    );
  }

  return (
    <div className="divide-y divide-blue-100 dark:divide-blue-900/30">
      {sorted.map((item) => {
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
            className="px-4 py-2.5 transition-colors hover:bg-blue-100/40 dark:hover:bg-blue-900/20"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground truncate text-xs font-medium">
                    {item.name}
                  </span>
                  {(item.email || '').trim().toLowerCase() ===
                    normalizedCurrentEmail && (
                      <span className="shrink-0 rounded-full border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        me
                      </span>
                    )}
                  {item === preferredMainItem && (
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      main
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-[10px]">
                  {stripLatex(item.title)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
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
              </div>
            </div>
            <div className="text-muted-foreground mt-1.5 grid gap-x-4 gap-y-0.5 pl-10 text-[10px] sm:grid-cols-2">
              <span>
                Created:{' '}
                <strong className="text-foreground/80 font-medium">
                  {formatDisplayDate(item.createdOnUtc)}
                </strong>
              </span>
              <span>
                Last modified:{' '}
                <strong className="text-foreground/80 font-medium">
                  {formatDisplayDate(item.lastModifiedOnUtc)}
                </strong>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const PaperOldSectionsManager = ({
  paperId,
  paperTitle,
}: {
  paperId: string;
  paperTitle: string;
}) => {
  const { data: user } = useUser();
  const currentUserEmail = (user?.email || '').trim().toLowerCase();
  const queryClient = useQueryClient();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(),
  );
  const [viewingReadOnlyMode, setViewingReadOnlyMode] =
    useState<boolean>(false);
  const [initialViewSectionId, setInitialViewSectionId] = useState<
    string | null
  >(null);
  const [viewTargetItem, setViewTargetItem] = useState<MarkSectionItem | null>(
    null,
  );
  const [sectionRoleFilter, setSectionRoleFilter] = useState<
    '' | 'section:read' | 'section:edit'
  >('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  const historyQuery = useAssignedSectionsHistory({
    paperId,
    params: {
      PageNumber: 1,
      PageSize: 1000,
      SectionRole: sectionRoleFilter || undefined,
      FromDate: fromDateFilter || undefined,
      ToDate: toDateFilter || undefined,
    },
    queryConfig: { enabled: !!paperId },
  });

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
      versions: [...g.versions].sort((a, b) => {
        if (b.version !== a.version) return b.version - a.version;
        return (
          new Date(b.lastModifiedOnUtc || b.createdOnUtc).getTime() -
          new Date(a.lastModifiedOnUtc || a.createdOnUtc).getTime()
        );
      }),
    }));

    result.sort((a, b) => {
      if (a.latest.displayOrder !== b.latest.displayOrder) {
        return a.latest.displayOrder - b.latest.displayOrder;
      }
      return stripLatex(a.latest.title).localeCompare(
        stripLatex(b.latest.title),
      );
    });

    return result;
  }, [oldSections]);

  const markSectionIdsToPrefetch = useMemo(() => {
    const ids = new Set<string>();
    groupedOldSections.forEach((group) =>
      group.versions.forEach((section) =>
        ids.add(section.markSectionId || section.id),
      ),
    );
    return Array.from(ids);
  }, [groupedOldSections]);

  useEffect(() => {
    if (markSectionIdsToPrefetch.length === 0) return;

    markSectionIdsToPrefetch.forEach((markSectionId) => {
      void queryClient.prefetchQuery({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION, markSectionId],
        queryFn: () => getMarkSection(markSectionId),
      });
    });
  }, [markSectionIdsToPrefetch, queryClient]);

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleVersionExpand = (id: string, markSectionId: string) => {
    void queryClient.fetchQuery({
      queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION, markSectionId],
      queryFn: () => getMarkSection(markSectionId),
    });

    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (viewingReadOnlyMode) {
    const editorSections = oldSections.map(
      (node: AssignedSectionHistoryItem) => ({
        id: node.id,
        markSectionId: node.markSectionId,
        paperId: node.paperId,
        title: stripLatex(node.title),
        content: node.content || '',
        memberId: node.memberId,
        numbered: node.numbered,
        sectionSumary: node.sectionSumary || '',
        parentSectionId: node.parentSectionId,
        sectionRole: node.sectionRole,
        description: node.description || '',
      }),
    );

    return (
      <LatexPaperEditor
        readOnly={true}
        paperTitle={paperTitle}
        sections={
          viewTargetItem
            ? [
              {
                id: viewTargetItem.sectionId,
                markSectionId: viewTargetItem.markSectionId,
                paperId,
                title: stripLatex(viewTargetItem.title),
                content: viewTargetItem.content || '',
                memberId: viewTargetItem.memberId,
                numbered: true,
                sectionSumary: '',
                parentSectionId: viewTargetItem.parentSectionId,
                sectionRole: viewTargetItem.sectionRole,
                description: viewTargetItem.description || '',
              },
            ]
            : editorSections
        }
        initialSectionId={
          viewTargetItem
            ? viewTargetItem.sectionId
            : initialViewSectionId || undefined
        }
        onClose={() => {
          setViewingReadOnlyMode(false);
          setViewTargetItem(null);
        }}
      />
    );
  }

  const totalCount = groupedOldSections.length;
  const hasActiveFilters = !!(
    sectionRoleFilter ||
    fromDateFilter ||
    toDateFilter
  );

  return (
    <div className="border-border bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border bg-muted/30 border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Layers className="text-primary h-5 w-5" />
          </div>
          <h3 className="text-foreground text-lg font-semibold">
            Old Sections
          </h3>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
          <select
            className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
            value={sectionRoleFilter}
            onChange={(e) =>
              setSectionRoleFilter(
                e.target.value as '' | 'section:read' | 'section:edit',
              )
            }
          >
            <option value="">All Permissions</option>
            <option value="section:read">read</option>
            <option value="section:edit">edit</option>
          </select>
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
              setSectionRoleFilter('');
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

      <div className="bg-background overflow-x-auto">
        {historyQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <TableHead className="w-10 text-center font-semibold text-green-900 dark:text-green-200">
                    #
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Section Title
                  </TableHead>
                  <TableHead className="w-32 text-right font-semibold text-green-900 dark:text-green-200">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedOldSections.flatMap((group, idx) => {
                  const groupSection = group.latest;
                  const isGroupExpanded = expandedGroups.has(group.key);
                  const canExpandGroup = group.versions.length > 0;

                  const row = (
                    <TableRow
                      key={group.key}
                      onClick={() => {
                        if (canExpandGroup) toggleGroupExpand(group.key);
                      }}
                      className={cn(
                        'transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20',
                        canExpandGroup && 'cursor-pointer',
                        idx % 2 === 0
                          ? 'bg-white dark:bg-transparent'
                          : 'bg-slate-50/50 dark:bg-slate-900/20',
                      )}
                    >
                      <TableCell className="text-center text-xs font-semibold">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-sm leading-snug font-semibold">
                            {stripLatex(groupSection.title)}
                          </span>
                          {canExpandGroup && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupExpand(group.key);
                              }}
                              className="text-muted-foreground hover:text-foreground ml-1 flex items-center gap-1 text-xs transition-colors"
                            >
                              {isGroupExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" />
                    </TableRow>
                  );

                  if (!canExpandGroup || !isGroupExpanded) return [row];

                  return [
                    row,
                    <TableRow
                      key={`${group.key}-versions`}
                      className="hover:bg-transparent"
                    >
                      <TableCell colSpan={3} className="p-0">
                        <div className="border-t border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/15">
                          {group.versions.map((version, versionIdx) => {
                            const versionNumber = `${idx + 1}.${versionIdx + 1}`;
                            const createdOn = formatDisplayDate(
                              version.createdOnUtc,
                            );
                            const lastModifiedOn = formatDisplayDate(
                              version.lastModifiedOnUtc,
                            );
                            const isVersionReadOnly = isReadOnlyHistoryEntry(
                              version.sectionRole,
                            );
                            const isVersionExpanded = expandedVersions.has(
                              version.id,
                            );

                            return (
                              <div
                                key={version.id}
                                className="border-b border-blue-100/70 px-4 py-2 last:border-b-0 dark:border-blue-900/30"
                              >
                                <div
                                  onClick={() => {
                                    if (!isVersionReadOnly) {
                                      toggleVersionExpand(
                                        version.id,
                                        version.markSectionId || version.id,
                                      );
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (isVersionReadOnly) return;
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      toggleVersionExpand(
                                        version.id,
                                        version.markSectionId || version.id,
                                      );
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center justify-between gap-2',
                                    !isVersionReadOnly && 'cursor-pointer',
                                  )}
                                  role={
                                    isVersionReadOnly ? undefined : 'button'
                                  }
                                  tabIndex={isVersionReadOnly ? undefined : 0}
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                      {versionNumber}
                                    </span>
                                    <span className="text-foreground truncate text-xs font-medium">
                                      {stripLatex(version.title)}
                                    </span>
                                    {versionIdx === 0 && (
                                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        main
                                      </span>
                                    )}
                                    {!isVersionReadOnly && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleVersionExpand(
                                            version.id,
                                            version.markSectionId || version.id,
                                          );
                                        }}
                                        className="text-muted-foreground hover:text-foreground ml-1 flex items-center gap-1 text-xs transition-colors"
                                      >
                                        {isVersionExpanded ? (
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInitialViewSectionId(version.id);
                                      setViewingReadOnlyMode(true);
                                    }}
                                    className={cn(
                                      'flex h-7 items-center gap-1 px-2 text-xs',
                                      BTN.VIEW_OUTLINE,
                                    )}
                                  >
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                </div>
                                <div className="text-muted-foreground mt-1.5 grid gap-x-4 gap-y-0.5 text-[10px] sm:grid-cols-2">
                                  <span>
                                    Created:{' '}
                                    <strong className="text-foreground/80 font-medium">
                                      {createdOn}
                                    </strong>
                                  </span>
                                  <span>
                                    Last modified:{' '}
                                    <strong className="text-foreground/80 font-medium">
                                      {lastModifiedOn}
                                    </strong>
                                  </span>
                                </div>
                                {!isVersionReadOnly && isVersionExpanded && (
                                  <div className="mt-2 border-t border-blue-100 pt-2 dark:border-blue-900/30">
                                    <SectionExpandedView
                                      markSectionId={
                                        version.markSectionId || version.id
                                      }
                                      currentUserEmail={currentUserEmail}
                                      onViewSection={(item) => {
                                        setViewTargetItem(item);
                                        setViewingReadOnlyMode(true);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>,
                  ];
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
