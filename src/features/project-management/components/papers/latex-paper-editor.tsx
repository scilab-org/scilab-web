import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Editor, { type Monaco } from '@monaco-editor/react';
import type * as MonacoEditor from 'monaco-editor';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  X,
  FileText,
  FileEdit,
  Save,
  Play,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  Package,
  Loader2,
  Keyboard,
  Copy,
  MessageSquareText,
  History,
  Database,
  BookMarked,
  Link2,
  ArrowLeft,
  Download,
  LayoutGrid,
  RefreshCw,
  Minus,
  Plus,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BTN } from '@/lib/button-styles';

import {
  getSectionReference,
  type SectionReferenceOtherItem,
  useGetSectionReference,
} from '@/features/paper-management/api/get-section-reference';
import {
  previewSectionReference,
  type PreviewReferencePaperBank,
} from '@/features/paper-management/api/preview-section-reference';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '@/features/paper-management/constants';
import { useUpdateSection } from '@/features/paper-management/api/update-section';
import { compileLatex } from '@/features/paper-management/api/compile-latex';
import {
  KNOWN_LATEX_PACKAGES,
  extractPackageName,
} from '@/features/paper-management/lib/latex-packages';
import {
  getMarkSection,
  useMarkSection,
} from '@/features/paper-management/api/get-mark-section';
import { getAssignedSectionsQueryOptions } from '@/features/paper-management/api/get-assigned-sections';
import { getSection } from '@/features/paper-management/api/get-section';
import { useGetSectionFiles } from '@/features/paper-management/api/get-section-files';
import { useUploadSectionFile } from '@/features/paper-management/api/upload-section-file';
import { useSectionComments } from '@/features/paper-management/api/get-section-comments';
import { SectionComments } from '@/features/paper-management/components/section-comments';
import { PaperOldSectionsManager } from '@/features/paper-management/components/paper-old-sections-manager';
import { useDatasets } from '@/features/dataset-management/api/get-datasets';
import { useProjectPapers } from '@/features/project-management/api/papers/get-project-papers';
import { useUser } from '@/lib/auth';
import { api } from '@/lib/api-client';
import type { WritingOutput } from '@/features/ai-chat/types';

import { EditorChatPanel } from './editor-chat-panel';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// LaTeX stats helper
const computeLatexStats = (latexContent: string) => {
  if (!latexContent)
    return {
      totalWords: 0,
      wordsInText: 0,
      wordsInHeaders: 0,
      numHeaders: 0,
      numFigures: 0,
      numMathInlines: 0,
      numMathDisplayed: 0,
    };

  const headerRe =
    /\\(?:chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\{([^}]*)\}/g;
  let numHeaders = 0;
  let wordsInHeaders = 0;
  let m: RegExpExecArray | null;

  while ((m = headerRe.exec(latexContent)) !== null) {
    numHeaders++;
    wordsInHeaders += m[1].trim().split(/\s+/).filter(Boolean).length;
  }

  const numFigures = (latexContent.match(/\\begin\s*\{figure\*?\}/g) || [])
    .length;
  const numDisplayedEnvs =
    latexContent.match(
      /\\begin\s*\{(?:equation|align|gather|multline|eqnarray|displaymath)\*?\}/g,
    )?.length || 0;
  const doubleDollarCount = (latexContent.match(/\$\$/g) || []).length;
  const numMathDisplayed = numDisplayedEnvs + Math.floor(doubleDollarCount / 2);

  const stripped4Inline = latexContent.replace(/\$\$[\s\S]*?\$\$/g, '');
  const numMathInlines = (stripped4Inline.match(/\$[^$\n]+?\$/g) || []).length;

  const stripped = latexContent
    .replace(/%[^\n]*/g, ' ')
    .replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, ' $1 ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}$%\\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const allWords = stripped
    .split(/\s+/)
    .filter((w) => w.length > 0 && /[a-zA-Z]/.test(w));
  const totalWords = allWords.length;
  const wordsInText = Math.max(0, totalWords - wordsInHeaders);

  return {
    totalWords,
    wordsInText,
    wordsInHeaders,
    numHeaders,
    numFigures,
    numMathInlines,
    numMathDisplayed,
  };
};

// ─── Write-mode diff view: line-by-line comparison ────────────────────────────

type DiffLine = {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
};

function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff for line-by-line comparison
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const diff: Array<{ type: 'unchanged' | 'added' | 'removed'; line: string }> =
    [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.push({ type: 'unchanged', line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: 'added', line: newLines[j - 1] });
      j--;
    } else {
      diff.push({ type: 'removed', line: oldLines[i - 1] });
      i--;
    }
  }
  diff.reverse();

  // Assign line numbers
  let oldLineNum = 1;
  let newLineNum = 1;
  for (const d of diff) {
    if (d.type === 'unchanged') {
      result.push({
        type: 'unchanged',
        content: d.line,
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      });
    } else if (d.type === 'removed') {
      result.push({
        type: 'removed',
        content: d.line,
        oldLineNum: oldLineNum++,
      });
    } else {
      result.push({
        type: 'added',
        content: d.line,
        newLineNum: newLineNum++,
      });
    }
  }

  return result;
}

const WriteDiffView = ({
  oldText,
  newText,
}: {
  oldText: string;
  newText: string;
}) => {
  const diffLines = useMemo(
    () => computeLineDiff(oldText, newText),
    [oldText, newText],
  );

  return (
    <div
      className="font-mono text-xs leading-[22px]"
      style={{ padding: '16px 0' }}
    >
      {diffLines.map((line, idx) => (
        <div
          key={idx}
          className={
            line.type === 'removed'
              ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
              : line.type === 'added'
                ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                : 'text-foreground'
          }
          style={{ display: 'flex', minHeight: '22px' }}
        >
          {/* Gutter: old line number */}
          <span
            className="text-muted-foreground/50 inline-block shrink-0 text-right select-none"
            style={{ width: '40px', paddingRight: '4px' }}
          >
            {line.oldLineNum ?? ''}
          </span>
          {/* Gutter: new line number */}
          <span
            className="text-muted-foreground/50 inline-block shrink-0 text-right select-none"
            style={{ width: '40px', paddingRight: '4px' }}
          >
            {line.newLineNum ?? ''}
          </span>
          {/* Change indicator */}
          <span
            className="inline-block shrink-0 text-center select-none"
            style={{ width: '20px' }}
          >
            {line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' '}
          </span>
          {/* Content */}
          <span
            className="break-all whitespace-pre-wrap"
            style={{ paddingRight: '16px' }}
          >
            {line.content || '\u00A0'}
          </span>
        </div>
      ))}
    </div>
  );
};

type MarkSectionItem = {
  sectionId: string;
  name: string;
  email: string;
  memberId: string;
  sectionRole: string;
  isMainSection: boolean;
  content: string;
  createdOnUtc?: string | null;
  lastModifiedOnUtc?: string | null;
  nextVersionSectionId?: string | null;
};

type SectionReferenceInUsePaperBank = {
  id: string;
  title: string | null;
  authors: string | null;
  journalName: string | null;
  conferenceName: string | null;
  doi: string | null;
};

type ProjectPaperBankOption = {
  id: string;
  title: string | null;
  journalName: string | null;
  conferenceName: string | null;
};

type PaperBankDetailForEditor = {
  id: string;
  title: string | null;
  abstract: string | null;
  filePath: string | null;
  authors: string | null;
  publisher: string | null;
  doi: string | null;
  publicationDate: string | null;
  paperType: string | null;
  journalName: string | null;
  conferenceName: string | null;
  pages: string | null;
  number: string | null;
  volume: string | null;
  referenceContent: string | null;
  tagNames: string[];
};

type SectionReferenceInUseResult = {
  referenceContent: string;
  paperBanks: SectionReferenceInUsePaperBank[];
};

const toReferencePaperRecord = (value: unknown): Record<string, unknown> => {
  const record = (value ?? {}) as Record<string, unknown>;

  if (record.paperBank && typeof record.paperBank === 'object') {
    return record.paperBank as Record<string, unknown>;
  }

  if (record.paper && typeof record.paper === 'object') {
    return record.paper as Record<string, unknown>;
  }

  return record;
};

const toInUsePaperBank = (paper: unknown): SectionReferenceInUsePaperBank => {
  const record = toReferencePaperRecord(paper);

  return {
    id: String(record.id ?? ''),
    title: (record.title as string | null) ?? null,
    authors: (record.authors as string | null) ?? null,
    journalName: (record.journalName as string | null) ?? null,
    conferenceName: (record.conferenceName as string | null) ?? null,
    doi: (record.doi as string | null) ?? null,
  };
};

const buildReferenceContentFromPapers = (papers: unknown[]): string => {
  return papers
    .map((paper) => {
      const record = toReferencePaperRecord(paper);
      return typeof record.referenceContent === 'string'
        ? record.referenceContent.trim()
        : '';
    })
    .filter(Boolean)
    .join('\n\n');
};

const hydrateReferenceContentFromPaperBanks = async (
  papers: unknown[],
): Promise<string> => {
  const uniquePaperIds = Array.from(
    new Set(
      papers
        .map((paper) => toReferencePaperRecord(paper))
        .map((record) => String(record.id ?? '').trim())
        .filter(Boolean),
    ),
  );

  if (uniquePaperIds.length === 0) {
    return '';
  }

  const detailResults = await Promise.allSettled(
    uniquePaperIds.map((paperBankId) =>
      getPaperBankDetailForEditor(paperBankId),
    ),
  );

  return detailResults
    .map((result) =>
      result.status === 'fulfilled'
        ? (result.value?.referenceContent ?? '')
        : '',
    )
    .map((value) => value.trim())
    .filter(Boolean)
    .join('\n\n');
};

const getSectionReferenceInUseForEditor = async (
  sectionId: string,
): Promise<SectionReferenceInUseResult> => {
  const response = (await api.get(
    `/lab-service/sections/${sectionId}/reference/in-use`,
  )) as {
    result?: {
      referenceContent?: unknown;
      paperBanks?: unknown[];
      items?: unknown[];
    };
  };

  const result = response?.result ?? {};
  const paperBanksSource = Array.isArray(result.paperBanks)
    ? result.paperBanks
    : Array.isArray(result.items)
      ? result.items
      : [];

  let referenceContent =
    typeof result.referenceContent === 'string'
      ? result.referenceContent
      : buildReferenceContentFromPapers(paperBanksSource);

  let paperBanks = paperBanksSource.map((paper) => toInUsePaperBank(paper));

  if (!referenceContent.trim()) {
    try {
      const fallback = await getSectionReference(sectionId);
      const inUsePapers = fallback.result?.inUse ?? [];

      referenceContent = buildReferenceContentFromPapers(inUsePapers);
      if (paperBanks.length === 0) {
        paperBanks = inUsePapers.map((paper) => toInUsePaperBank(paper));
      }

      if (!referenceContent.trim()) {
        referenceContent =
          await hydrateReferenceContentFromPaperBanks(inUsePapers);
      }
    } catch {
      // Keep the empty state if the fallback endpoint also fails.
    }
  }

  return {
    referenceContent,
    paperBanks,
  };
};

const updateSectionReferenceForEditor = async ({
  sectionId,
  paperId,
  paperBankIds,
}: {
  sectionId: string;
  paperId: string;
  paperBankIds: string[];
}) => {
  return api.put(`/lab-service/sections/${sectionId}/reference`, {
    paperId,
    paperBankIds,
  });
};

const getPaperBankDetailForEditor = async (
  paperBankId: string,
): Promise<PaperBankDetailForEditor | null> => {
  const response = (await api.get(
    `/lab-service/paper-bank/${paperBankId}`,
  )) as {
    result?: {
      paperBank?: Record<string, unknown>;
      paper?: Record<string, unknown>;
    };
  };

  const source =
    (response?.result?.paperBank as Record<string, unknown> | undefined) ??
    (response?.result?.paper as Record<string, unknown> | undefined) ??
    null;

  if (!source) return null;

  return {
    id: String(source.id ?? ''),
    title: (source.title as string | null) ?? null,
    abstract: (source.abstract as string | null) ?? null,
    filePath: (source.filePath as string | null) ?? null,
    authors: (source.authors as string | null) ?? null,
    publisher: (source.publisher as string | null) ?? null,
    doi: (source.doi as string | null) ?? null,
    publicationDate: (source.publicationDate as string | null) ?? null,
    paperType: (source.paperType as string | null) ?? null,
    journalName: (source.journalName as string | null) ?? null,
    conferenceName: (source.conferenceName as string | null) ?? null,
    pages: (source.pages as string | null) ?? null,
    number: (source.number as string | null) ?? null,
    volume: (source.volume as string | null) ?? null,
    referenceContent: (source.referenceContent as string | null) ?? null,
    tagNames: Array.isArray(source.tagNames)
      ? source.tagNames.filter((tag): tag is string => typeof tag === 'string')
      : [],
  };
};

const SectionVersionsPanel = ({
  markSectionId,
  currentUserEmail,
  excludeSectionId,
  onViewItem,
}: {
  markSectionId: string;
  currentUserEmail: string;
  excludeSectionId?: string;
  onViewItem: (item: MarkSectionItem) => void;
}) => {
  const formatVersionTimestamp = (value?: string | null) => {
    if (!value) return 'Unavailable';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unavailable';

    return parsed.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const query = useMarkSection({ markSectionId: markSectionId || null });
  const allItems: MarkSectionItem[] = query.data?.result?.items ?? [];
  const [cachedItems, setCachedItems] = useState<MarkSectionItem[]>([]);

  useEffect(() => {
    if (query.data?.result?.items) {
      setCachedItems(query.data.result.items);
    }
  }, [query.data?.result?.items]);

  const displayedItemsSource = allItems.length > 0 ? allItems : cachedItems;

  const items = displayedItemsSource.filter((i) => {
    if (i.isMainSection) return true;
    if (excludeSectionId && i.sectionId === excludeSectionId) return false;
    if ((i.email || '').toLowerCase() === currentUserEmail.toLowerCase())
      return false;
    return true;
  });

  if (query.isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-xs text-slate-400">
        Loading sections...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        No contributor versions found.
      </div>
    );
  }

  const COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-rose-500',
  ];

  const sorted = [...items].sort((a, b) => {
    if (a.isMainSection && !b.isMainSection) return -1;
    if (!a.isMainSection && b.isMainSection) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="relative flex flex-col">
      {query.isFetching && (
        <div className="sticky top-0 z-10 flex items-center justify-center bg-white/85 py-2 text-xs text-slate-400 backdrop-blur-sm dark:bg-slate-950/85">
          Loading sections...
        </div>
      )}
      {sorted.map((item, idx) => {
        const displayName = item.isMainSection
          ? 'Origin section'
          : item.name || item.email;
        const initials = item.isMainSection
          ? 'M'
          : item.name
            ? item.name
                .split(' ')
                .map((w: string) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : '?';

        return (
          <button
            key={item.sectionId}
            type="button"
            onClick={() => onViewItem(item)}
            className="group mx-3 my-1.5 flex w-auto items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50 hover:shadow-md active:translate-y-0 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900"
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[10px] font-bold text-white shadow-sm transition-transform duration-150 group-hover:scale-105 ${
                item.isMainSection
                  ? 'bg-emerald-500'
                  : COLORS[idx % COLORS.length]
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {displayName}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.isMainSection
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.isMainSection ? 'Main' : 'Contributor'}
                    </span>
                  </div>
                  {!item.isMainSection && (
                    <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                      {item.email}
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600" />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    Created at
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {formatVersionTimestamp(item.createdOnUtc)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                    Last modified
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {formatVersionTimestamp(item.lastModifiedOnUtc)}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const DraftsTabPanel = ({
  markSectionId,
  currentUserEmail,
  activeSectionId,
  onOpenVersionPreview,
}: {
  markSectionId: string;
  currentUserEmail: string;
  activeSectionId: string | null;
  onOpenVersionPreview: (item: MarkSectionItem) => void;
}) => {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {markSectionId ? (
        <SectionVersionsPanel
          markSectionId={markSectionId}
          currentUserEmail={currentUserEmail}
          excludeSectionId={activeSectionId ?? undefined}
          onViewItem={onOpenVersionPreview}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No section context for drafts.
        </div>
      )}
    </div>
  );
};

const VersionsTabPanel = ({
  paperId,
  paperTitle,
  onOpenVersionPreview,
}: {
  paperId: string;
  paperTitle: string;
  onOpenVersionPreview: (item: MarkSectionItem) => void;
}) => {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {paperId ? (
        <PaperOldSectionsManager
          paperId={paperId}
          paperTitle={paperTitle}
          onViewSection={onOpenVersionPreview}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No paper context available to load version history.
        </div>
      )}
    </div>
  );
};

const ReferencesTab = ({
  sectionId,
  compact = false,
  onOpenSectionInEditor,
}: {
  sectionId?: string;
  compact?: boolean;
  onOpenSectionInEditor?: (
    section: SectionReferenceOtherItem['sections'][number],
  ) => void;
}) => {
  const query = useGetSectionReference({
    sectionId: sectionId ?? null,
  });
  const inUse = useMemo(
    () => query.data?.result?.inUse ?? [],
    [query.data?.result?.inUse],
  );
  const otherReferences = useMemo(
    () => query.data?.result?.otherReference ?? [],
    [query.data?.result?.otherReference],
  );
  const [selectedReference, setSelectedReference] = useState<{
    type: 'in-use' | 'other';
    index: number;
  } | null>(null);

  useEffect(() => {
    setSelectedReference(null);
  }, [sectionId]);

  const handleSectionClick = useCallback(
    (section: SectionReferenceOtherItem['sections'][number]) => {
      if (!onOpenSectionInEditor) return;

      onOpenSectionInEditor(section);
      setSelectedReference(null);
    },
    [onOpenSectionInEditor],
  );

  const activeReference = useMemo(() => {
    if (!selectedReference) return null;

    if (selectedReference.type === 'in-use') {
      return {
        type: 'in-use' as const,
        index: selectedReference.index,
        paper: inUse[selectedReference.index] ?? null,
      };
    }

    return {
      type: 'other' as const,
      index: selectedReference.index,
      item: otherReferences[selectedReference.index] ?? null,
    };
  }, [inUse, otherReferences, selectedReference]);

  const activePaper =
    activeReference?.type === 'in-use'
      ? activeReference.paper
      : activeReference?.type === 'other'
        ? (activeReference.item?.paperBank ?? null)
        : null;
  const activeTags = Array.isArray(activePaper?.tagNames)
    ? activePaper.tagNames
    : [];
  const activeSections =
    activeReference?.type === 'other' &&
    Array.isArray(activeReference.item?.sections)
      ? activeReference.item.sections
      : [];

  const renderPaperCard = (
    paper: {
      id: string;
      title: string | null;
      abstract: string | null;
      doi: string | null;
      filePath: string | null;
      journalName: string | null;
      conferenceName: string | null;
      publicationDate: string | null;
      tagNames: string[];
    },
    index: number,
  ) => (
    <button
      key={paper.id}
      type="button"
      onClick={() => setSelectedReference({ type: 'in-use', index })}
      className={
        compact
          ? 'flex w-full items-start gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30'
          : 'flex w-full items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30'
      }
    >
      <span className="shrink-0 text-[10px] font-bold text-slate-400">
        [{index + 1}]
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`leading-snug font-semibold text-slate-800 dark:text-slate-200 ${compact ? 'text-sm' : 'text-sm'}`}
        >
          {paper.title || '(Untitled)'}
        </p>
        {(paper.journalName || paper.conferenceName) && (
          <p className="mt-0.5 text-xs text-slate-500 italic">
            {paper.journalName || paper.conferenceName}
          </p>
        )}
        {!compact && paper.doi && (
          <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 dark:text-blue-400">
            <Link2 className="h-2.5 w-2.5" />
            {paper.doi}
          </p>
        )}
        {!compact && paper.publicationDate && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {new Date(paper.publicationDate).getFullYear()}
          </p>
        )}
      </div>
    </button>
  );

  if (!sectionId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-slate-400">
        Select a section to load references.
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8 text-xs text-slate-400">
        Loading references…
      </div>
    );
  }

  if (inUse.length === 0 && otherReferences.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <BookMarked className="h-7 w-7 text-slate-300 dark:text-slate-600" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No references linked to this section yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-700 dark:bg-slate-900/40'
          : 'flex flex-1 flex-col overflow-y-auto p-4'
      }
    >
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold tracking-wide text-slate-700 uppercase dark:text-slate-300">
              In use ({inUse.length})
            </p>
          </div>
          <ol className={compact ? 'space-y-1.5' : 'space-y-2'}>
            {inUse.map((paper, index) => renderPaperCard(paper, index))}
          </ol>
        </div>

        {otherReferences.length > 0 && (
          <div
            className={
              compact
                ? 'mt-2'
                : 'mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50'
            }
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold tracking-wide text-slate-700 uppercase dark:text-slate-300">
                Other references ({otherReferences.length})
              </p>
            </div>

            <div className="space-y-1.5">
              {otherReferences.map((item, index) => (
                <button
                  key={item.paperBank.id}
                  type="button"
                  onClick={() => setSelectedReference({ type: 'other', index })}
                  className={
                    compact
                      ? 'flex w-full items-start gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30'
                      : 'flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30'
                  }
                >
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">
                    [{index + 1}]
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-semibold text-slate-800 dark:text-slate-100">
                      {item.paperBank.title || `Reference ${index + 1}`}
                    </p>
                    {(item.paperBank.journalName ||
                      item.paperBank.conferenceName) && (
                      <p className="mt-0.5 text-xs text-slate-500 italic">
                        {item.paperBank.journalName ||
                          item.paperBank.conferenceName}
                      </p>
                    )}
                    {!compact && item.paperBank.doi && (
                      <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                        <Link2 className="h-2.5 w-2.5" />
                        {item.paperBank.doi}
                      </p>
                    )}
                    {!compact && item.paperBank.publicationDate && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {new Date(item.paperBank.publicationDate).getFullYear()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!activeReference}
        onOpenChange={(open) => {
          if (!open) setSelectedReference(null);
        }}
      >
        <DialogContent className="w-[min(1040px,calc(100vw-2rem))]! max-w-none! gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          {activePaper ? (
            <div className="flex max-h-[88vh] flex-col overflow-hidden">
              <div className="border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/70 px-6 py-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                <div className="flex items-start justify-between gap-4 pr-8 sm:pr-10">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          activeReference?.type === 'in-use'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="rounded-full px-2.5 py-0.5 text-[10px]"
                      >
                        {activeReference?.type === 'in-use'
                          ? 'In use'
                          : 'Other reference'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <h2 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {activePaper.title || '(Untitled)'}
                      </h2>
                      <p className="max-w-2xl text-xs text-slate-500 dark:text-slate-400">
                        {activeReference?.type === 'in-use'
                          ? 'Reference currently used in this section'
                          : 'Other reference linked to this section'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-1.5">
                    {activeReference?.type === 'in-use' ? (
                      <Badge
                        variant="outline"
                        className="rounded-full px-2.5 py-0.5 text-[10px]"
                      >
                        {activeTags.length} tags
                      </Badge>
                    ) : (
                      <>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2.5 py-0.5 text-[10px]"
                        >
                          {activeTags.length} tags
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2.5 py-0.5 text-[10px]"
                        >
                          {activeSections.length} sections
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
                <div className="space-y-4">
                  {activePaper.abstract && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                          Abstract
                        </p>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0.5 text-[10px]"
                        >
                          Preview
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {activePaper.abstract}
                      </p>
                    </section>
                  )}

                  {activeSections.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            Sections using this paper
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Click a section to jump in editor
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0.5 text-[10px]"
                        >
                          {activeSections.length}
                        </Badge>
                      </div>
                      <div className="max-h-80 space-y-2 overflow-auto pr-1">
                        {activeSections.map((section, index) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => handleSectionClick(section)}
                            className="group w-full rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white px-3 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {index + 1}
                                  </span>
                                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {section.title || '(Untitled section)'}
                                  </p>
                                  <span className="shrink-0 text-[10px] text-slate-400">
                                    -
                                  </span>
                                  <span className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                    Created by {section.createdBy || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2 py-0.5 text-[10px]"
                                >
                                  Jump
                                </Badge>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <aside className="min-w-[320px] space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      Information
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Authors
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activePaper.authors || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Publisher
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activePaper.publisher || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Journal / Conference
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activePaper.journalName ||
                            activePaper.conferenceName ||
                            'Not provided'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Year
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activePaper.publicationDate
                              ? new Date(
                                  activePaper.publicationDate,
                                ).getFullYear()
                              : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Sections
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activeSections.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Volume
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activePaper.volume || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Number
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activePaper.number || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Pages
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activePaper.pages || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          DOI
                        </p>
                        {activePaper.doi ? (
                          <a
                            href={`https://doi.org/${activePaper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono break-all text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <Link2 className="h-3 w-3" />
                            {activePaper.doi}
                          </a>
                        ) : (
                          <p className="mt-0.5 font-medium">Not provided</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Tags
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activeTags.length ? (
                            activeTags.slice(0, 8).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="rounded-full px-2 py-0.5 text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              No tags
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {activePaper.filePath && (
                    <a
                      href={activePaper.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      <Download className="h-4 w-4" />
                      Open file
                    </a>
                  )}
                </aside>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InlineReferenceSectionEditor = ({
  content,
  canEdit,
  isDirty,
  isSaving,
  onChange,
  onSave,
  mode = 'editor',
  usedReferenceContent = '',
  usedPaperBanks = [],
  isUsedReferenceLoading = false,
  availablePaperBanks = [],
  isAvailablePaperBanksLoading = false,
  currentPaperId,
  currentSectionId,
  currentSectionTitle,
  onUpdateReference,
  isUpdatingReference = false,
  onActiveReferenceContentChange,
  isSectionContentDirty = false,
  onSaveSectionContent,
  isSavingSectionContent = false,
  pendingReferencedPaperIds = [],
}: {
  content: string;
  canEdit: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onChange: (value: string | undefined) => void;
  onSave: () => void;
  mode?: 'editor' | 'in-use';
  usedReferenceContent?: string;
  usedPaperBanks?: SectionReferenceInUsePaperBank[];
  isUsedReferenceLoading?: boolean;
  availablePaperBanks?: ProjectPaperBankOption[];
  isAvailablePaperBanksLoading?: boolean;
  currentPaperId?: string;
  currentSectionId?: string;
  currentSectionTitle?: string;
  onUpdateReference?: (paperBankIds: string[]) => Promise<boolean>;
  isUpdatingReference?: boolean;
  onActiveReferenceContentChange?: (content: string) => void;
  isSectionContentDirty?: boolean;
  onSaveSectionContent?: () => void;
  isSavingSectionContent?: boolean;
  /** Paper IDs returned by the writing LLM — auto-populates the Preview tab. */
  pendingReferencedPaperIds?: string[];
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isBankDetailDialogOpen, setIsBankDetailDialogOpen] = useState(false);
  const [isBankDetailLoading, setIsBankDetailLoading] = useState(false);
  const [inUseEditorHeight, setInUseEditorHeight] = useState(288);
  const [activeBankDetail, setActiveBankDetail] =
    useState<PaperBankDetailForEditor | null>(null);
  const [selectedPaperBankIds, setSelectedPaperBankIds] = useState<string[]>(
    [],
  );
  const [showSaveBeforeUpdateDialog, setShowSaveBeforeUpdateDialog] =
    useState(false);

  // Review / In Use toggle state
  const [referenceViewTab, setReferenceViewTab] = useState<'in-use' | 'review'>(
    'in-use',
  );
  const [reviewReferenceContent, setReviewReferenceContent] = useState('');
  const [reviewPaperBanks, setReviewPaperBanks] = useState<
    PreviewReferencePaperBank[]
  >([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const togglePaperBank = useCallback((paperBankId: string) => {
    setSelectedPaperBankIds((prev) =>
      prev.includes(paperBankId)
        ? prev.filter((id) => id !== paperBankId)
        : [...prev, paperBankId],
    );
  }, []);

  const handleSubmitUpdateReference = useCallback(async () => {
    if (!onUpdateReference) return;
    const isSuccessful = await onUpdateReference(selectedPaperBankIds);
    if (isSuccessful) {
      setIsUpdateDialogOpen(false);
    }
  }, [onUpdateReference, selectedPaperBankIds]);

  const handleOpenBankDetail = useCallback(async (paperBankId: string) => {
    setIsBankDetailDialogOpen(true);
    setIsBankDetailLoading(true);
    try {
      const detail = await getPaperBankDetailForEditor(paperBankId);
      setActiveBankDetail(detail);
    } catch {
      setActiveBankDetail(null);
      toast.error('Failed to load paper bank detail.');
    } finally {
      setIsBankDetailLoading(false);
    }
  }, []);

  const handleStartResizeInUseEditor = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = inUseEditorHeight;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const nextHeight = Math.min(640, Math.max(160, startHeight - deltaY));
        setInUseEditorHeight(nextHeight);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [inUseEditorHeight],
  );

  // Fetch review data when switching to review tab
  const loadReviewData = useCallback(async () => {
    // TODO: replace with real logic (e.g. availablePaperBanks or otherReferences IDs)
    const allIds = [
      'bbf97430-1f65-4548-b776-cecb94669b7b',
      '9d7fb1ae-1a4e-4e98-b2b1-33f5bda50a01',
      '51133ee3-3dfe-46c0-bf38-6c61aaed3032',
    ];
    if (allIds.length === 0) {
      setReviewReferenceContent('');
      setReviewPaperBanks([]);
      return;
    }
    setIsReviewLoading(true);
    try {
      const response = await previewSectionReference(allIds);
      setReviewReferenceContent(response.result.referenceContent);
      setReviewPaperBanks(response.result.paperBanks);
    } catch {
      setReviewReferenceContent('');
      setReviewPaperBanks([]);
      toast.error('Failed to load review references.');
    } finally {
      setIsReviewLoading(false);
    }
  }, []);

  const handleSwitchTab = useCallback(
    (tab: 'in-use' | 'review') => {
      setReferenceViewTab(tab);
      if (tab === 'review') {
        void loadReviewData();
        // Notify parent that compile should use review content
        onActiveReferenceContentChange?.(reviewReferenceContent);
      } else {
        // Switch back to in-use: notify parent to use in-use content
        onActiveReferenceContentChange?.(usedReferenceContent);
      }
    },
    [
      loadReviewData,
      reviewReferenceContent,
      usedReferenceContent,
      onActiveReferenceContentChange,
    ],
  );

  // Notify parent whenever review reference content changes (after fetch)
  useEffect(() => {
    if (referenceViewTab === 'review' && reviewReferenceContent) {
      onActiveReferenceContentChange?.(reviewReferenceContent);
    }
  }, [
    referenceViewTab,
    reviewReferenceContent,
    onActiveReferenceContentChange,
  ]);

  // When switching back to in-use, sync parent
  useEffect(() => {
    if (referenceViewTab === 'in-use') {
      onActiveReferenceContentChange?.(usedReferenceContent);
    }
  }, [referenceViewTab, usedReferenceContent, onActiveReferenceContentChange]);

  // When the writing LLM returns referenced paper IDs, auto-populate the
  // Preview tab and switch to it so the user can inspect before accepting.
  useEffect(() => {
    if (pendingReferencedPaperIds.length === 0) return;

    let cancelled = false;
    setIsReviewLoading(true);
    setReferenceViewTab('review');

    previewSectionReference(pendingReferencedPaperIds)
      .then((response) => {
        if (cancelled) return;
        setReviewReferenceContent(response.result.referenceContent);
        setReviewPaperBanks(response.result.paperBanks);
        onActiveReferenceContentChange?.(response.result.referenceContent);
      })
      .catch(() => {
        if (cancelled) return;
        setReviewReferenceContent('');
        setReviewPaperBanks([]);
        toast.error('Failed to load preview references.');
      })
      .finally(() => {
        if (!cancelled) setIsReviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReferencedPaperIds]);

  // Auto-select review paper bank IDs in update dialog
  const handleOpenUpdateDialog = useCallback(() => {
    if (isSectionContentDirty) {
      setShowSaveBeforeUpdateDialog(true);
      return;
    }
    if (referenceViewTab === 'review') {
      // Pre-select the review paper bank IDs
      const ids = reviewPaperBanks.map((p) => p.id).filter(Boolean);
      setSelectedPaperBankIds(Array.from(new Set(ids)));
    } else {
      const ids = usedPaperBanks
        .map((paper) => paper.id)
        .filter((id): id is string => !!id);
      setSelectedPaperBankIds(Array.from(new Set(ids)));
    }
    setIsUpdateDialogOpen(true);
  }, [
    isSectionContentDirty,
    referenceViewTab,
    reviewPaperBanks,
    usedPaperBanks,
  ]);

  return (
    <>
      <div className="relative shrink-0 border-t border-[#e8e8e6] bg-[#fafafa] dark:border-[#2a2a2a] dark:bg-[#151515]">
        {isExpanded && mode === 'in-use' && (
          <button
            type="button"
            aria-label="Resize reference content"
            onMouseDown={handleStartResizeInUseEditor}
            className="absolute -top-2 left-0 z-10 h-3 w-full cursor-row-resize bg-transparent p-0 text-transparent outline-none"
            title="Resize reference content"
          />
        )}

        <div className="flex h-9 items-center justify-between border-b border-[#e8e8e6] px-3 dark:border-[#2a2a2a]">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4f6ef7]">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              References
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title={isExpanded ? 'Collapse references' : 'Expand references'}
              aria-label={
                isExpanded ? 'Collapse references' : 'Expand references'
              }
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {mode === 'in-use' && (
              <div className="flex h-6 items-center rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('in-use')}
                  className={`h-5 rounded px-2 text-[10px] font-medium transition-colors ${
                    referenceViewTab === 'in-use'
                      ? 'bg-[#4f6ef7] text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  In Use
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('review')}
                  className={`h-5 rounded px-2 text-[10px] font-medium transition-colors ${
                    referenceViewTab === 'review'
                      ? 'bg-[#4f6ef7] text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Preview
                </button>
              </div>
            )}
            {mode !== 'in-use' && (
              <span className="text-[10px] text-slate-400">SOURCE - LATEX</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode === 'in-use' ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenUpdateDialog}
                  disabled={!currentPaperId || !currentSectionId}
                  className="h-6 px-2 text-[10px]"
                >
                  Update reference
                </Button>
              </>
            ) : (
              <>
                {isDirty && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    Unsaved changes
                  </span>
                )}
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {canEdit ? 'Editable' : 'Read only'}
                </span>
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving}
                    className="h-6 px-2 text-[10px]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Save References'
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {isExpanded &&
          (mode === 'in-use' ? (
            <div className="border-t border-transparent">
              {referenceViewTab === 'in-use' ? (
                // In Use tab content
                isUsedReferenceLoading ? (
                  <div className="flex h-72 items-center gap-2 px-3 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading reference content...
                  </div>
                ) : usedReferenceContent.trim() ? (
                  <div
                    className="overflow-hidden"
                    style={{ height: `${inUseEditorHeight}px` }}
                  >
                    <Editor
                      height="100%"
                      defaultLanguage="latex-custom"
                      value={usedReferenceContent}
                      beforeMount={registerLatexLanguage}
                      theme="latex-light"
                      options={{
                        readOnly: true,
                        domReadOnly: true,
                        fontSize: 14,
                        lineHeight: 22,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 10, bottom: 10 },
                        automaticLayout: true,
                        tabSize: 2,
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        fontFamily:
                          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                        fontLigatures: true,
                        smoothScrolling: true,
                        scrollbar: {
                          verticalScrollbarSize: 6,
                          horizontalScrollbarSize: 6,
                          useShadows: false,
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400">
                    No reference content is currently in use for this section.
                  </p>
                )
              ) : // Review tab content
              isReviewLoading ? (
                <div className="flex h-72 items-center gap-2 px-3 text-xs text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading review references...
                </div>
              ) : reviewReferenceContent.trim() ? (
                <div
                  className="overflow-hidden"
                  style={{ height: `${inUseEditorHeight}px` }}
                >
                  <Editor
                    height="100%"
                    defaultLanguage="latex-custom"
                    value={reviewReferenceContent}
                    beforeMount={registerLatexLanguage}
                    theme="latex-light"
                    options={{
                      readOnly: true,
                      domReadOnly: true,
                      fontSize: 14,
                      lineHeight: 22,
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      padding: { top: 10, bottom: 10 },
                      automaticLayout: true,
                      tabSize: 2,
                      lineNumbers: 'on',
                      renderLineHighlight: 'line',
                      fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                      fontLigatures: true,
                      smoothScrolling: true,
                      scrollbar: {
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                        useShadows: false,
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400">
                  No review references available. Add paper banks to your
                  project to preview references.
                </p>
              )}
            </div>
          ) : (
            <div className="h-72">
              <Editor
                height="100%"
                defaultLanguage="latex-custom"
                value={content}
                onChange={onChange}
                theme="latex-light"
                beforeMount={registerLatexLanguage}
                options={{
                  readOnly: !canEdit,
                  domReadOnly: !canEdit,
                  fontSize: 14,
                  lineHeight: 22,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 10, bottom: 10 },
                  automaticLayout: true,
                  tabSize: 2,
                  lineNumbers: 'on',
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                    useShadows: false,
                  },
                }}
              />
            </div>
          ))}
      </div>

      <Dialog
        open={showSaveBeforeUpdateDialog}
        onOpenChange={setShowSaveBeforeUpdateDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the section content. Please save your
              changes before updating the reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSaveBeforeUpdateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSavingSectionContent}
              onClick={() => {
                onSaveSectionContent?.();
                setShowSaveBeforeUpdateDialog(false);
              }}
            >
              {isSavingSectionContent && (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden pt-9 sm:max-w-2xl [&>button]:top-3 [&>button]:right-3 [&>button]:z-20">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Update references
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Selected: {selectedPaperBankIds.length}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Available: {availablePaperBanks.length}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              <p>Section title: {currentSectionTitle || '-'}</p>
            </div>

            <div className="max-h-[50vh] w-full space-y-2 overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              {isAvailablePaperBanksLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading paper banks...
                </div>
              ) : availablePaperBanks.length > 0 ? (
                availablePaperBanks.map((paper) => {
                  const checked = selectedPaperBankIds.includes(paper.id);
                  return (
                    <label
                      key={paper.id}
                      className={`grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-x-2 rounded-lg border px-3 py-2.5 transition-colors ${
                        checked
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-3.5 w-3.5 shrink-0"
                        checked={checked}
                        onChange={() => togglePaperBank(paper.id)}
                      />
                      <div className="min-w-0 overflow-hidden">
                        <p
                          className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100"
                          title={paper.title || 'Untitled paper'}
                        >
                          {paper.title || 'Untitled paper'}
                        </p>
                        {(paper.journalName || paper.conferenceName) && (
                          <p
                            className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400"
                            title={
                              paper.journalName || paper.conferenceName || ''
                            }
                          >
                            {paper.journalName || paper.conferenceName}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleOpenBankDetail(paper.id);
                        }}
                        title="View detail"
                        aria-label="View detail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No paper banks found in this project.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
                disabled={isUpdatingReference}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitUpdateReference}
                disabled={
                  isUpdatingReference || !currentPaperId || !currentSectionId
                }
              >
                {isUpdatingReference ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  'Update Reference'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBankDetailDialogOpen}
        onOpenChange={(open) => {
          setIsBankDetailDialogOpen(open);
          if (!open) setActiveBankDetail(null);
        }}
      >
        <DialogContent
          overlayClassName="bg-black/50"
          className="max-h-[88vh] w-[min(1220px,calc(100vw-2rem))]! max-w-none! overflow-hidden pt-9 [&>button]:top-3 [&>button]:right-3 [&>button]:z-20"
        >
          {isBankDetailLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading paper detail...
            </div>
          ) : activeBankDetail ? (
            <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {activeBankDetail.title || 'Untitled paper'}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Reference currently used in this section
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
                <div className="space-y-4">
                  {activeBankDetail.abstract && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                          Abstract
                        </p>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0.5 text-[10px]"
                        >
                          Preview
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {activeBankDetail.abstract}
                      </p>
                    </section>
                  )}

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      Reference content
                    </p>
                    <div className="mt-2 h-80 max-h-[65vh] min-h-45 resize-y overflow-auto">
                      <Editor
                        height="100%"
                        defaultLanguage="latex-custom"
                        value={activeBankDetail.referenceContent || ''}
                        beforeMount={registerLatexLanguage}
                        theme="latex-light"
                        options={{
                          readOnly: true,
                          domReadOnly: true,
                          fontSize: 13,
                          lineHeight: 22,
                          minimap: { enabled: false },
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          padding: { top: 10, bottom: 10 },
                          automaticLayout: true,
                          tabSize: 2,
                          lineNumbers: 'off',
                          glyphMargin: false,
                          lineDecorationsWidth: 0,
                          folding: false,
                          renderLineHighlight: 'line',
                          fontFamily:
                            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                          fontLigatures: true,
                          smoothScrolling: true,
                          scrollbar: {
                            verticalScrollbarSize: 6,
                            horizontalScrollbarSize: 6,
                            useShadows: false,
                          },
                        }}
                      />
                    </div>
                  </section>
                </div>

                <aside className="min-w-[320px] space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      Information
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Authors
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activeBankDetail.authors || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Publisher
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activeBankDetail.publisher || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Journal / Conference
                        </p>
                        <p className="mt-0.5 font-medium">
                          {activeBankDetail.journalName ||
                            activeBankDetail.conferenceName ||
                            'Not provided'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Year
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activeBankDetail.publicationDate
                              ? new Date(
                                  activeBankDetail.publicationDate,
                                ).getFullYear()
                              : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Volume
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activeBankDetail.volume || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Number
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activeBankDetail.number || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                            Pages
                          </p>
                          <p className="mt-0.5 font-medium">
                            {activeBankDetail.pages || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          DOI
                        </p>
                        {activeBankDetail.doi ? (
                          <a
                            href={
                              activeBankDetail.doi.startsWith('http')
                                ? activeBankDetail.doi
                                : `https://doi.org/${activeBankDetail.doi}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono break-all text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <Link2 className="h-3 w-3" />
                            {activeBankDetail.doi}
                          </a>
                        ) : (
                          <p className="mt-0.5 font-medium">Not provided</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase dark:text-slate-400">
                          Tags
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activeBankDetail.tagNames.length ? (
                            activeBankDetail.tagNames.slice(0, 8).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="rounded-full px-2 py-0.5 text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              No tags
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeBankDetail.filePath && (
                    <a
                      href={activeBankDetail.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      <Download className="h-4 w-4" />
                      Open file
                    </a>
                  )}
                </aside>
              </div>
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
              No detail available.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Datasets tab panel ────────────────────────────────────────────────────────
const DatasetsTab = ({ projectId }: { projectId: string }) => {
  const query = useDatasets({
    params: { projectId, PageNumber: 1, PageSize: 50 },
  });
  const datasets = query.data?.result?.items ?? [];

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-slate-400">
        Loading datasets…
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <Database className="h-6 w-6 text-slate-300 dark:text-slate-600" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No datasets available for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {datasets.map((ds) => (
        <div
          key={ds.id}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {ds.name}
              </p>
              {ds.description && (
                <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {ds.description}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                ds.status === 1
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {ds.status === 1 ? 'Active' : 'Inactive'}
            </span>
          </div>
          {ds.filePath && (
            <a
              href={ds.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Link2 className="h-2.5 w-2.5" />
              Download file
            </a>
          )}
          <p className="mt-1 text-[10px] text-slate-400">
            {new Date(ds.createdOnUtc).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * Register a custom LaTeX language + theme so that
 * commands are green, math delimiters purple, etc.
 */
const registerLatexLanguage = (monaco: Monaco) => {
  const languageExists = monaco.languages
    .getLanguages()
    .some((l: { id: string }) => l.id === 'latex-custom');
  if (!languageExists) {
    monaco.languages.register({ id: 'latex-custom' });
  }

  monaco.languages.setMonarchTokensProvider('latex-custom', {
    tokenizer: {
      root: [
        // Comments
        [/%.*$/, 'comment'],

        // Math environments  $$...$$  and  $...$
        [/\$\$/, { token: 'delimiter.math', next: '@mathDisplay' }],
        [/\$/, { token: 'delimiter.math', next: '@mathInline' }],

        // \begin{...} / \end{...}  — environment names
        [
          /(\\(?:begin|end))(\{)([^}]*)(\})/,
          ['keyword', 'delimiter.curly', 'type.identifier', 'delimiter.curly'],
        ],

        // LaTeX commands  \commandname
        [/\\[a-zA-Z@]+/, 'keyword'],

        // Escaped special chars  \$ \% etc.
        [/\\./, 'keyword'],

        // Curly braces
        [/[{}]/, 'delimiter.curly'],

        // Square brackets
        [/\[/, 'delimiter.square'],
        [/\]/, 'delimiter.square'],

        // Numbers
        [/\d+(\.\d+)?/, 'number'],
      ],

      mathDisplay: [
        [/\$\$/, { token: 'delimiter.math', next: '@pop' }],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/[{}]/, 'delimiter.curly'],
        [/./, 'string.math'],
      ],

      mathInline: [
        [/\$/, { token: 'delimiter.math', next: '@pop' }],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/[{}]/, 'delimiter.curly'],
        [/./, 'string.math'],
      ],
    },
  });

  const latexCompletions = [
    {
      label: '\\section',
      insertText: '\\section{$1}',
      detail: 'Section heading',
    },
    {
      label: '\\subsection',
      insertText: '\\subsection{$1}',
      detail: 'Subsection heading',
    },
    {
      label: '\\subsubsection',
      insertText: '\\subsubsection{$1}',
      detail: 'Subsubsection heading',
    },
    {
      label: '\\paragraph',
      insertText: '\\paragraph{$1}',
      detail: 'Paragraph heading',
    },
    {
      label: '\\textbf',
      insertText: '\\textbf{$1}',
      detail: 'Bold text',
    },
    {
      label: '\\textit',
      insertText: '\\textit{$1}',
      detail: 'Italic text',
    },
    {
      label: '\\underline',
      insertText: '\\underline{$1}',
      detail: 'Underline text',
    },
    {
      label: '\\emph',
      insertText: '\\emph{$1}',
      detail: 'Emphasized text',
    },
    {
      label: '\\begin{itemize}',
      insertText: '\\begin{itemize}\n  \\item $1\n\\end{itemize}',
      detail: 'Itemize environment',
    },
    {
      label: '\\begin{enumerate}',
      insertText: '\\begin{enumerate}\n  \\item $1\n\\end{enumerate}',
      detail: 'Enumerate environment',
    },
    {
      label: '\\begin{equation}',
      insertText: '\\begin{equation}\n  $1\n\\end{equation}',
      detail: 'Equation environment',
    },
    {
      label: '\\begin{align}',
      insertText: '\\begin{align}\n  $1\n\\end{align}',
      detail: 'Align environment',
    },
    {
      label: '\\begin{figure}',
      insertText:
        '\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.8\\textwidth]{$1}\n  \\caption{$2}\n  \\label{fig:$3}\n\\end{figure}',
      detail: 'Figure template',
    },
    {
      label: '\\includegraphics',
      insertText: '\\includegraphics[width=0.8\\textwidth]{$1}',
      detail: 'Insert image',
    },
    {
      label: '\\cite',
      insertText: '\\cite{$1}',
      detail: 'Citation',
    },
    {
      label: '\\ref',
      insertText: '\\ref{$1}',
      detail: 'Reference label',
    },
    {
      label: '\\label',
      insertText: '\\label{$1}',
      detail: 'Create label',
    },
    {
      label: '\\frac',
      insertText: '\\frac{$1}{$2}',
      detail: 'Fraction',
    },
    {
      label: '\\sqrt',
      insertText: '\\sqrt{$1}',
      detail: 'Square root',
    },
  ];

  monaco.languages.registerCompletionItemProvider('latex-custom', {
    triggerCharacters: ['\\', ...'abcdefghijklmnopqrstuvwxyz'.split('')],
    provideCompletionItems: (
      model: MonacoEditor.editor.ITextModel,
      position: MonacoEditor.Position,
    ) => {
      const linePrefix = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1);
      const match = linePrefix.match(/\\[a-zA-Z]*$/);

      if (!match) {
        return { suggestions: [] };
      }

      const typed = match[0].slice(1).toLowerCase();
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column - match[0].length,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };

      const suggestions = latexCompletions
        .filter((item) => item.label.slice(1).toLowerCase().includes(typed))
        .map((item) => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: item.insertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: item.detail,
          range,
        }));

      return { suggestions };
    },
  });

  // Custom light theme
  monaco.editor.defineTheme('latex-light', {
    base: 'vs',
    inherit: true,
    semanticHighlighting: false,
    rules: [
      // Keep command highlighting only; all other tokens are plain black.
      { token: 'keyword', foreground: '2f6b5b', fontStyle: '' },
      { token: 'string.math', foreground: '000000', fontStyle: '' },
      { token: 'delimiter.math', foreground: '000000', fontStyle: '' },
      { token: 'type.identifier', foreground: '000000', fontStyle: '' },
      { token: 'delimiter.curly', foreground: '000000', fontStyle: '' },
      { token: 'delimiter.square', foreground: '000000', fontStyle: '' },
      { token: 'comment', foreground: '000000', fontStyle: '' },
      { token: 'number', foreground: '000000', fontStyle: '' },
      { token: 'number.float', foreground: '000000', fontStyle: '' },
      { token: 'number.hex', foreground: '000000', fontStyle: '' },
      { token: 'constant.numeric', foreground: '000000', fontStyle: '' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#dbeafe',
      'editor.inactiveSelectionBackground': '#e2e8f0',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#0550ae',
      'editorCursor.foreground': '#0550ae',
      'editorIndentGuide.background': '#f1f5f9',
      'editorIndentGuide.activeBackground': '#e2e8f0',
      'editorBracketMatch.background': '#dbeafe',
      'editorBracketMatch.border': '#93c5fd',
    },
  });
};

type SectionProp = {
  id: string;
  markSectionId?: string;
  paperId?: string;
  title: string;
  content: string;
  packages?: string[];
  memberId: string;
  numbered: boolean;
  sectionSumary: string;
  parentSectionId: string | null;
  sectionRole?: string;
  description?: string;
};

type LatexPaperEditorProps = {
  paperTitle: string;
  projectId?: string;
  draftStorageScope?: string;
  initialContent?: string;
  sections?: SectionProp[];
  initialSectionId?: string;
  onClose: () => void;
  onSave?: (content: string, sectionId?: string) => void;
  readOnly?: boolean;
};

type CursorPosition = {
  lineNumber: number;
  column: number;
};

const getFileNameFromUrl = (fileUrl: string): string => {
  try {
    const { pathname } = new URL(fileUrl);
    const value = pathname.split('/').filter(Boolean).pop();
    return value ? decodeURIComponent(value) : fileUrl;
  } catch {
    const value = fileUrl.split('/').filter(Boolean).pop();
    return value ? decodeURIComponent(value) : fileUrl;
  }
};

const isImageFileUrl = (fileUrl: string): boolean => {
  const imageExtRegex = /\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?)$/i;

  try {
    const { pathname } = new URL(fileUrl);
    return imageExtRegex.test(pathname);
  } catch {
    const normalized = fileUrl.split('?')[0] ?? fileUrl;
    return imageExtRegex.test(normalized);
  }
};

const toLatexLabel = (fileUrl: string): string => {
  const fileName = getFileNameFromUrl(fileUrl);
  return fileName
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
};

const toPlainSectionTitle = (title: string): string => {
  if (!title) return '';

  let result = title;
  const cmdPattern = /\\[a-zA-Z*]+\{([^{}]*)\}/g;
  let prev = '';
  while (prev !== result) {
    prev = result;
    result = result.replace(cmdPattern, '$1');
  }

  return result.replace(/[{}]/g, '').trim().toLowerCase();
};

export const LatexPaperEditor = ({
  paperTitle,
  projectId,
  initialContent,
  sections,
  initialSectionId,
  onClose,
  onSave,
  readOnly = false,
}: LatexPaperEditorProps) => {
  const editableSectionRoles = new Set(['paper:author', 'section:edit']);

  const [content, setContent] = useState(initialContent ?? '');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarResourceTab, setSidebarResourceTab] = useState<
    'files' | 'packages'
  >('packages');
  const [localPackages, setLocalPackages] = useState<string[]>([]);
  const [savedPackages, setSavedPackages] = useState<string[]>([]);
  const [newPackageInput, setNewPackageInput] = useState('');
  const [editingPkgIdx, setEditingPkgIdx] = useState<number | null>(null);
  const [editingPkgValue, setEditingPkgValue] = useState('');
  const [pkgViewTab, setPkgViewTab] = useState<'current' | 'reference'>(
    'current',
  );
  const [pkgPanelOpen, setPkgPanelOpen] = useState(true);
  const commitPkgEdit = (idx: number, value: string) => {
    const trimmed = value.trim();
    setEditingPkgIdx(null);
    setEditingPkgValue('');
    if (!trimmed) return;
    setLocalPackages((prev) => prev.map((p, i) => (i === idx ? trimmed : p)));
  };
  // Packages for the reference section (editable in the Reference tab)
  const [localRefPackages, setLocalRefPackages] = useState<string[]>([]);
  const [editingRefPkgIdx, setEditingRefPkgIdx] = useState<number | null>(null);
  const [editingRefPkgValue, setEditingRefPkgValue] = useState('');
  const [newRefPackageInput, setNewRefPackageInput] = useState('');
  const commitRefPkgEdit = (idx: number, value: string) => {
    const trimmed = value.trim();
    setEditingRefPkgIdx(null);
    setEditingRefPkgValue('');
    if (!trimmed) return;
    setLocalRefPackages((prev) =>
      prev.map((p, i) => (i === idx ? trimmed : p)),
    );
  };
  const [editorSections, setEditorSections] = useState<
    SectionProp[] | undefined
  >(sections);
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'files'>(
    sections?.length ? 'sections' : 'files',
  );
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    () => initialSectionId || (sections?.[0]?.id ?? null),
  );
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [toolsTab, setToolsTab] = useState<
    'chat' | 'drafts' | 'versions' | 'comments' | 'datasets'
  >('chat');
  const [isSidebarRefOpen, setIsSidebarRefOpen] = useState(true);
  const [editorWidthPct, setEditorWidthPct] = useState(50);
  const [pdfZoom, setPdfZoom] = useState(100);
  // Version preview state: when set, editor shows a read-only version tab
  const [versionPreview, setVersionPreview] = useState<{
    item: MarkSectionItem;
    returnSectionId: string | null;
  } | null>(null);
  // Editable preview content — non-null when author is editing a non-main contributor version
  const [previewEditContent, setPreviewEditContent] = useState<string | null>(
    null,
  );
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorColRef = useRef<HTMLDivElement>(null);
  const widthPctRef = useRef(50);
  const [savedContent, setSavedContent] = useState(initialContent ?? '');
  const [pendingWriteOutput, setPendingWriteOutput] = useState<string | null>(
    null,
  );
  const [pendingReferencedPaperIds, setPendingReferencedPaperIds] = useState<
    string[]
  >([]);
  const [copiedFileUrl, setCopiedFileUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const cursorPositionRef = useRef<CursorPosition | null>(null);
  const previousActiveSectionIdRef = useRef<string | null>(null);
  const previousActiveSectionInfoRef = useRef<{
    id: string;
    markSectionId: string;
    memberId: string;
    sectionRole: string;
    title: string;
    parentSectionId: string | null;
  } | null>(null);
  const prevSectionMarksRef = useRef(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastReadOnlyToastRef = useRef<number>(0);
  // Flag set by handleSave to prevent the sections-sync effects from
  // overwriting local state with stale parent prop data.
  const saveInProgressRef = useRef(false);

  useEffect(() => {
    // When a save just completed successfully, the editor's local state
    // already has the correct new section ID and content. Do NOT let the
    // parent's stale `sections` prop overwrite it.
    if (saveInProgressRef.current) {
      saveInProgressRef.current = false;
      return;
    }

    // Save current active section info before editorSections is replaced.
    // The matching effect needs this when the version-specific ID is no
    // longer present in the new (structural) sections list.
    const currentActive = activeSectionRef.current;
    if (currentActive) {
      previousActiveSectionInfoRef.current = {
        id: currentActive.id,
        markSectionId: (currentActive.markSectionId || currentActive.id).trim(),
        memberId: currentActive.memberId,
        sectionRole: currentActive.sectionRole || '',
        title: currentActive.title,
        parentSectionId: currentActive.parentSectionId,
      };
    }

    // Detect whether the section *structure* changed (sections added/removed)
    // vs a simple data refresh (same set of markSectionIds).
    const newMarks = new Set(
      (sections ?? [])
        .map((s) => (s.markSectionId || s.id).trim())
        .filter(Boolean),
    );
    const prevMarks = prevSectionMarksRef.current;
    const structureChanged =
      prevMarks.size !== newMarks.size ||
      [...newMarks].some((m) => !prevMarks.has(m)) ||
      [...prevMarks].some((m) => !newMarks.has(m));
    prevSectionMarksRef.current = newMarks;

    setEditorSections(sections);

    // Only force a server re-fetch when sections were genuinely added or
    // removed. After a save-triggered refresh the markSectionIds stay the
    // same, so the editor already has the latest content — resetting the
    // ref here would cause an unnecessary re-fetch cascade.
    if (structureChanged) {
      previousActiveSectionIdRef.current = null;
    }
  }, [sections]);

  useEffect(() => {
    const fallbackSectionId = initialSectionId || sections?.[0]?.id || null;
    if (!fallbackSectionId) return;

    setActiveSectionId((prev) => {
      if (!sections?.length) return prev ?? fallbackSectionId;
      if (prev && sections.some((section) => section.id === prev)) {
        return prev;
      }

      // Try the live editorSections first; when the version-specific ID was
      // replaced by a structural ID (parent refresh after save), fall back
      // to the snapshot saved before the replacement.
      const previousSection =
        (prev
          ? editorSections?.find((section) => section.id === prev)
          : null) ?? previousActiveSectionInfoRef.current;

      if (previousSection) {
        const previousMarkSectionId =
          previousSection.markSectionId || previousSection.id;

        const matchedByMarkAndIdentity = sections.find((section) => {
          const currentMarkSectionId = section.markSectionId || section.id;
          return (
            currentMarkSectionId === previousMarkSectionId &&
            section.memberId === previousSection.memberId &&
            section.sectionRole === previousSection.sectionRole
          );
        });

        if (matchedByMarkAndIdentity) {
          // Sync the ref so loadLatestSectionContent does not treat the new
          // ID as a section switch and trigger an unnecessary server fetch.
          previousActiveSectionIdRef.current = matchedByMarkAndIdentity.id;
          return matchedByMarkAndIdentity.id;
        }

        const matchedByMark = sections.find((section) => {
          const currentMarkSectionId = section.markSectionId || section.id;
          return currentMarkSectionId === previousMarkSectionId;
        });

        if (matchedByMark) {
          previousActiveSectionIdRef.current = matchedByMark.id;
          return matchedByMark.id;
        }

        const matchedByStructure = sections.find(
          (section) =>
            section.title === previousSection.title &&
            section.parentSectionId === previousSection.parentSectionId &&
            section.memberId === previousSection.memberId,
        );

        if (matchedByStructure) {
          previousActiveSectionIdRef.current = matchedByStructure.id;
          return matchedByStructure.id;
        }
      }

      return fallbackSectionId;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSectionId, sections]);

  const activeSection =
    editorSections?.find((section) => section.id === activeSectionId) ?? null;
  const activeSectionTitle =
    editorSections?.find((section) => section.id === activeSectionId)?.title ??
    null;
  const referenceSection = useMemo(
    () =>
      editorSections?.find((section) => {
        const normalizedTitle = toPlainSectionTitle(section.title || '');
        return (
          normalizedTitle === 'references' || normalizedTitle === 'reference'
        );
      }) ?? null,
    [editorSections],
  );
  const isReferenceSectionActive =
    !!referenceSection && activeSectionId === referenceSection.id;

  // Keep localRefPackages in sync whenever the reference section loads or changes

  useEffect(() => {
    setLocalRefPackages(referenceSection?.packages ?? []);
  }, [referenceSection?.id, referenceSection?.packages]);

  // Whether the active user is an author (paper:author role)
  const isAuthorRole = activeSection?.sectionRole === 'paper:author';

  // Version preview helpers
  const handleOpenVersionPreview = useCallback(
    (item: MarkSectionItem) => {
      // Authors can edit non-main contributor versions directly
      const canEditPreview = isAuthorRole && !item.isMainSection;
      setPreviewEditContent(canEditPreview ? item.content || '' : null);
      setVersionPreview({ item, returnSectionId: activeSectionId });
    },
    [activeSectionId, isAuthorRole],
  );
  const handleCloseVersionPreview = useCallback(() => {
    setVersionPreview(null);
    setPreviewEditContent(null);
  }, []);
  const hasEditPermissionForActiveSection =
    !activeSection?.sectionRole ||
    editableSectionRoles.has(activeSection.sectionRole);
  const isActiveSectionReadOnly =
    readOnly || !hasEditPermissionForActiveSection;

  // Reset package input when switching sections (packages are set after API response below)
  useEffect(() => {
    setNewPackageInput('');
  }, [activeSectionId]);
  const canEditReferenceSection =
    !!referenceSection &&
    !readOnly &&
    (!referenceSection.sectionRole ||
      editableSectionRoles.has(referenceSection.sectionRole));
  const [referenceContent, setReferenceContent] = useState('');
  const [savedReferenceContent, setSavedReferenceContent] = useState('');
  const [inUseReferenceContent, setInUseReferenceContent] = useState('');
  const [inUsePaperBanks, setInUsePaperBanks] = useState<
    SectionReferenceInUsePaperBank[]
  >([]);
  const [isInUseReferenceLoading, setIsInUseReferenceLoading] = useState(false);
  const [isUpdatingReference, setIsUpdatingReference] = useState(false);
  const [activeRefContentOverride, setActiveRefContentOverride] = useState<
    string | null
  >(null);
  const [inUseReferenceReloadKey, setInUseReferenceReloadKey] = useState(0);
  // Tracks the resolved section ID after assigned-sections lookup —
  // used everywhere that needs the latest server-side section ID.
  const [resolvedActiveSectionId, setResolvedActiveSectionId] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();
  const assignedSectionsParams = useMemo(
    () => ({ PageNumber: 1, PageSize: 1000 }),
    [],
  );

  // Derive paperId from sections for version history
  const derivedPaperId =
    activeSection?.paperId || editorSections?.[0]?.paperId || '';

  // Active section's markSectionId for contributor list
  const activeSectionMarkId =
    activeSection?.markSectionId || activeSectionId || '';

  // Stable ref so loadInUseReferences can read the full section object
  // without depending on the object reference (prevents re-fetch on Save Changes)
  const activeSectionRef = useRef<SectionProp | null>(activeSection);
  activeSectionRef.current = activeSection;

  // Stable refs so the in-use-reference effect can read current editor state
  // without causing re-run on every keystroke / package change.
  const contentRef = useRef(content);
  contentRef.current = content;
  const localPackagesRef = useRef(localPackages);
  localPackagesRef.current = localPackages;
  const localRefPackagesRef = useRef(localRefPackages);
  localRefPackagesRef.current = localRefPackages;
  const inUseReferenceContentRef = useRef(inUseReferenceContent);
  inUseReferenceContentRef.current = inUseReferenceContent;
  const editorSectionsRef = useRef(editorSections);
  editorSectionsRef.current = editorSections;

  // Current user for "me" badges
  const { data: currentUser } = useUser();
  const currentUserEmail = (currentUser?.email || '').toLowerCase();

  const projectPapersQuery = useProjectPapers({
    projectId: projectId ?? '',
    params: { PageNumber: 1, PageSize: 200 },
    queryConfig: { enabled: !!projectId },
  });
  const availableProjectPaperBanks = useMemo<ProjectPaperBankOption[]>(() => {
    const items =
      ((projectPapersQuery.data as any)?.result?.items as Array<
        Record<string, unknown>
      >) ?? [];

    return items.map((paper) => ({
      id: String(paper.id ?? ''),
      title: (paper.title as string | null) ?? null,
      journalName: (paper.journalName as string | null) ?? null,
      conferenceName: (paper.conferenceName as string | null) ?? null,
    }));
  }, [projectPapersQuery.data]);
  // ── Write-mode diff: accept/reject callbacks ──────────────────────────
  const handleWriteOutput = useCallback((output: WritingOutput) => {
    setPendingWriteOutput(output.content);
    setPendingReferencedPaperIds(output.referencedPaperIds ?? []);
  }, []);

  const handleUpdateSectionReferenceRef = useRef<
    ((paperBankIds: string[]) => Promise<boolean>) | null
  >(null);

  const handleAcceptChanges = useCallback(() => {
    if (pendingWriteOutput !== null) {
      setContent(pendingWriteOutput);
      setPendingWriteOutput(null);
    }
  }, [pendingWriteOutput]);

  const handleRejectChanges = useCallback(() => {
    setPendingWriteOutput(null);
    setPendingReferencedPaperIds([]);
  }, []);

  // LaTeX stats computed from current content
  const latexStats = useMemo(() => computeLatexStats(content), [content]);

  const sectionFilesQuery = useGetSectionFiles({
    sectionId: activeSectionId,
    enabled: !!activeSectionId && !isActiveSectionReadOnly,
  });
  const sectionFiles = isActiveSectionReadOnly
    ? []
    : (sectionFilesQuery.data ?? []);

  // The section ID used for the Comments tab. When a contributor version
  // preview is open, show that contributor's comments; otherwise default
  // to the current active section.
  const commentsSectionId =
    versionPreview?.item.sectionId ?? resolvedActiveSectionId ?? null;

  useSectionComments({
    sectionId: resolvedActiveSectionId ?? '',
    queryConfig: {
      enabled: !!resolvedActiveSectionId,
    },
  });

  // Pre-warm comments for the contributor section as soon as preview opens.
  useSectionComments({
    sectionId: versionPreview?.item.sectionId ?? '',
    queryConfig: {
      enabled:
        !!versionPreview?.item.sectionId &&
        versionPreview.item.sectionId !== resolvedActiveSectionId,
    },
  });

  const uploadSectionFileMutation = useUploadSectionFile({
    mutationConfig: {
      onSuccess: () => {
        toast.success('File uploaded successfully');
      },
      onError: () => {
        toast.error('Failed to upload file. Please try again.');
      },
    },
  });

  const updateSectionMutation = useUpdateSection({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Section saved successfully', {
          id: 'section-save-success',
          duration: 3000,
        });
      },
      onError: () => {
        toast.error('Failed to save section. Please try again.', {
          id: 'section-save-error',
          duration: 3000,
        });
      },
    },
  });

  const compileAndRender = useCallback(
    async (latexContent: string, packages?: string[], refContent?: string) => {
      setIsCompiling(true);
      setCompileError(null);
      try {
        const refPkgs = localRefPackagesRef.current;
        const blob = await compileLatex({
          content: latexContent,
          packages,
          referencePackages: refPkgs,
          referenceContent: refContent,
        });
        if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
        const newUrl = URL.createObjectURL(blob);
        pdfUrlRef.current = newUrl;
        setPdfUrl(newUrl);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to compile LaTeX';
        setCompileError(message);
        toast.error('LaTeX compilation failed', {
          id: 'latex-compile-error',
          duration: 3000,
        });
      } finally {
        setIsCompiling(false);
      }
    },
    [],
  );

  // Compile LaTeX to PDF via API
  const handleRender = useCallback(() => {
    // Compile using what is currently displayed in the UI.
    // The inline References panel (shown when the active section is NOT the
    // reference section) displays ONLY the in-use reference content.
    // If the user switched to the Review tab, use the override content instead.
    const displayedRefContent =
      referenceSection && !isReferenceSectionActive
        ? (activeRefContentOverride ?? inUseReferenceContent)
        : undefined;

    if (versionPreview) {
      compileAndRender(
        previewEditContent ?? versionPreview.item.content ?? '',
        localPackages,
        displayedRefContent,
      );
      return;
    }
    if (isActiveSectionReadOnly) return;
    compileAndRender(content, localPackages, displayedRefContent);
  }, [
    localPackages,
    content,
    inUseReferenceContent,
    activeRefContentOverride,
    previewEditContent,
    versionPreview,
    compileAndRender,
    isActiveSectionReadOnly,
    referenceSection,
    isReferenceSectionActive,
  ]);

  // Clean up PDF blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  const resolveLatestSectionIdFromAssignedSections = useCallback(
    async (
      markSectionId: string,
      sectionSnapshot?: SectionProp | null,
      options?: { forceFresh?: boolean },
    ) => {
      if (!derivedPaperId) return null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { queryKey, queryFn } = getAssignedSectionsQueryOptions(
            derivedPaperId,
            assignedSectionsParams,
          );

          const shouldForceFresh = Boolean(options?.forceFresh) || attempt > 0;

          if (shouldForceFresh) {
            await queryClient.invalidateQueries({ queryKey });
          }

          const assignedResponse = await queryClient.fetchQuery({
            queryKey,
            queryFn,
            staleTime: shouldForceFresh ? 0 : 15_000,
          });
          const assignedItems = assignedResponse.result?.items ?? [];

          const exactMatch = sectionSnapshot
            ? assignedItems.find(
                (item) =>
                  (item.markSectionId || item.id) === markSectionId &&
                  item.memberId === sectionSnapshot.memberId &&
                  item.sectionRole === sectionSnapshot.sectionRole,
              )
            : undefined;

          const markMatch = assignedItems.find(
            (item) => (item.markSectionId || item.id) === markSectionId,
          );

          const resolvedId = exactMatch?.id || markMatch?.id || null;
          if (resolvedId) return resolvedId;
        } catch {
          // ignore and retry
        }

        if (attempt < 2) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 200);
          });
        }
      }

      return null;
    },
    [assignedSectionsParams, derivedPaperId, queryClient],
  );

  // When sections or activeSectionId changes, load content into editor
  useEffect(() => {
    let disposed = false;

    const loadLatestSectionContent = async () => {
      // While a save is in progress, handleSave manages all state directly.
      // Do NOT interfere by resolving IDs or fetching section content.
      if (saveInProgressRef.current) return;

      if (!editorSections || !activeSectionId) return;

      const activeSection = editorSections.find(
        (s) => s.id === activeSectionId,
      );
      if (!activeSection) return;

      const isSectionSwitched =
        previousActiveSectionIdRef.current !== activeSectionId;

      // Only refresh/reset when actually switching sections to avoid jank on save
      if (!isSectionSwitched) return;

      try {
        // Always resolve the newest id from assigned-sections before loading content.
        const markSectionId = (
          activeSection.markSectionId || activeSection.id
        ).trim();
        const resolvedId =
          (await resolveLatestSectionIdFromAssignedSections(
            markSectionId,
            activeSection,
          )) || activeSectionId;

        // Read packages from the assigned-sections cache that was just populated above.
        // This is the authoritative source for packages (set per section by the author).
        const cachedAssigned = queryClient.getQueryData<{
          result: { items: Array<{ id: string; packages?: string[] | null }> };
        }>(
          getAssignedSectionsQueryOptions(
            derivedPaperId ?? '',
            assignedSectionsParams,
          ).queryKey,
        );
        const packagesFromAssigned =
          cachedAssigned?.result?.items?.find((item) => item.id === resolvedId)
            ?.packages ?? undefined;

        if (disposed) return;

        if (resolvedId !== activeSectionId) {
          setEditorSections((prev) => {
            if (!prev?.length) return prev;
            return prev.map((section) =>
              section.id === activeSectionId
                ? { ...section, id: resolvedId }
                : section,
            );
          });
          setActiveSectionId(resolvedId);
          // Keep tracking the resolved ID as "current" so the effect does not
          // re-trigger itself endlessly when it re-runs with the new
          // activeSectionId. The getSection call below will fetch content for
          // resolvedId, and the result handler sets the ref to the final id.
          previousActiveSectionIdRef.current = resolvedId;
        }

        const response = await getSection(resolvedId);
        if (disposed) return;

        const latest = response.result;
        const latestId = latest.id || resolvedId;
        const latestContent = latest.content || '';

        setEditorSections((prev) => {
          if (!prev?.length) return prev;

          return prev.map((section) => {
            // Match on BOTH possible IDs: the stale closure `activeSectionId`
            // (when resolvedId === activeSectionId) and `resolvedId` (when they
            // differ and the first block already swapped the id). Using both
            // ensures the section is found regardless of which ID is current in
            // the prev array at the time this updater runs.
            if (section.id !== activeSectionId && section.id !== resolvedId)
              return section;

            return {
              ...section,
              id: latestId,
              title: latest.title || section.title,
              content: latestContent,
              packages: latest.packages || section.packages,
              numbered: latest.numbered,
              displayOrder: latest.displayOrder,
              sectionSumary: latest.sectionSumary || '',
              description: latest.description || section.description,
              parentSectionId: latest.parentSectionId ?? null,
              memberId: latest.memberId || section.memberId,
            };
          });
        });

        if (latestId !== activeSectionId || latestId !== resolvedId) {
          // Use a functional setter so we only take effect when the current
          // activeSectionId matches what this effect resolved. If another
          // concurrent effect (e.g. loadInUseReferences) has already moved it
          // somewhere else, we must not clobber that.
          setActiveSectionId((prev) => {
            if (prev === activeSectionId || prev === resolvedId) {
              previousActiveSectionIdRef.current = latestId;
              return latestId;
            }
            return prev;
          });
        } else {
          previousActiveSectionIdRef.current = activeSectionId;
        }

        setContent(latestContent);
        setSavedContent(latestContent);
        const resolvedPkgs =
          latest.packages ??
          packagesFromAssigned ??
          activeSection.packages ??
          [];
        setLocalPackages(resolvedPkgs);
        setSavedPackages(resolvedPkgs);
        if (latestContent) {
          compileAndRender(
            latestContent,
            resolvedPkgs,
            inUseReferenceContentRef.current || undefined,
          );
        } else {
          setPdfUrl(null);
          setCompileError(null);
        }
      } catch {
        const fallbackContent = activeSection.content || '';
        const fallbackPkgs = activeSection.packages ?? [];
        setLocalPackages(fallbackPkgs);
        setSavedPackages(fallbackPkgs);

        setContent(fallbackContent);
        setSavedContent(fallbackContent);
        if (fallbackContent) {
          compileAndRender(
            fallbackContent,
            fallbackPkgs,
            inUseReferenceContentRef.current || undefined,
          );
        } else {
          setPdfUrl(null);
          setCompileError(null);
        }
        previousActiveSectionIdRef.current = activeSectionId;
      }
    };

    void loadLatestSectionContent();

    return () => {
      disposed = true;
    };
  }, [
    editorSections,
    activeSectionId,
    compileAndRender,
    resolveLatestSectionIdFromAssignedSections,
    derivedPaperId,
    assignedSectionsParams,
    queryClient,
  ]);

  useEffect(() => {
    if (!editorSections?.length && sidebarTab !== 'files') {
      setSidebarTab('files' as const);
    }
  }, [editorSections, sidebarTab]);

  useEffect(() => {
    if (!referenceSection) {
      setReferenceContent('');
      setSavedReferenceContent('');
      return;
    }

    const nextContent = referenceSection.content || '';
    setReferenceContent(nextContent);
    setSavedReferenceContent(nextContent);
  }, [referenceSection]);

  useEffect(() => {
    let disposed = false;

    // While a save is in progress, handleSave manages all state directly.
    // Do NOT interfere by resolving IDs or resetting resolvedActiveSectionId.
    if (saveInProgressRef.current) return;

    // Read from the ref so the effect doesn't depend on the activeSection object
    // reference. This prevents a re-fetch every time editorSections is updated
    // (e.g. after Save Changes), since the object reference changes even though
    // the section identity (id + markSectionId) stays the same.
    const section = activeSectionRef.current;

    if (!section) {
      setInUseReferenceContent('');
      setInUsePaperBanks([]);
      setIsInUseReferenceLoading(false);
      setResolvedActiveSectionId(null);
      return;
    }

    const loadInUseReferences = async () => {
      // Only reset the resolved ID (blanking the sidebar) when the active
      // section actually changed identity. When reloading the same section
      // (e.g. after Save Changes / reload-key bump) keep the previous value
      // so the sidebar stays populated during the async resolution.
      const currentSectionIdentity = (
        section.markSectionId || section.id
      ).trim();
      setResolvedActiveSectionId((prev) => {
        // If the previous resolved ID belongs to a completely different section
        // (neither the raw id nor the mark id matches), blank it now.
        const sameSection =
          prev === section.id ||
          prev === section.markSectionId ||
          prev === currentSectionIdentity;
        return sameSection ? prev : null;
      });
      // Keep compilation consistent with what the user sees in the References panel.
      // While loading, the UI shows a loading state (and should not reuse stale content).
      setInUseReferenceContent('');
      setInUsePaperBanks([]);
      setIsInUseReferenceLoading(true);
      try {
        // When previousActiveSectionIdRef already matches the current section ID,
        // it means handleSave (or a previous resolution) already resolved the
        // correct ID. Skip re-resolution to avoid cascading state changes that
        // cause "Section not found" errors from stale/racing API calls.
        const alreadyResolved =
          previousActiveSectionIdRef.current === section.id;

        let sectionIdForReferences = section.id;

        if (!alreadyResolved) {
          const markSectionId = (section.markSectionId || section.id).trim();
          const resolvedSectionId =
            (await resolveLatestSectionIdFromAssignedSections(
              markSectionId,
              section,
            )) || section.id;

          if (disposed) return;

          sectionIdForReferences = resolvedSectionId;
          setResolvedActiveSectionId(resolvedSectionId);

          if (resolvedSectionId !== section.id) {
            setEditorSections((prev) => {
              if (!prev?.length) return prev;
              return prev.map((s) =>
                s.id === section.id ? { ...s, id: resolvedSectionId } : s,
              );
            });
            // Use functional setter: only update activeSectionId if it still
            // matches section.id. If loadLatestSectionContent already advanced
            // it to the actual latest version, we must not overwrite that.
            setActiveSectionId((prev) => {
              if (prev === section.id) {
                previousActiveSectionIdRef.current = resolvedSectionId;
                return resolvedSectionId;
              }
              return prev;
            });
          }
        } else {
          setResolvedActiveSectionId(section.id);
        }

        const data = await getSectionReferenceInUseForEditor(
          sectionIdForReferences,
        );
        if (disposed) return;
        setInUseReferenceContent(data.referenceContent);
        setInUsePaperBanks(data.paperBanks);

        // Re-compile with merged content now that in-use references are
        // available. Use stable refs to avoid stale closure on content/packages.
        if (data.referenceContent && contentRef.current) {
          compileAndRender(
            contentRef.current,
            localPackagesRef.current,
            data.referenceContent,
          );
        }
      } catch {
        if (disposed) return;
        setInUseReferenceContent('');
        setInUsePaperBanks([]);
      } finally {
        if (!disposed) {
          setIsInUseReferenceLoading(false);
        }
      }
    };

    void loadInUseReferences();

    return () => {
      disposed = true;
    };
  }, [
    activeSectionId,
    activeSectionMarkId,
    inUseReferenceReloadKey,
    resolveLatestSectionIdFromAssignedSections,
    compileAndRender,
  ]);

  const refreshSectionFromServer = useCallback(
    async (sectionIdToFetch: string, sectionSnapshot?: SectionProp | null) => {
      const targetSection =
        sectionSnapshot ||
        editorSections?.find((section) => section.id === sectionIdToFetch) ||
        null;

      const targetIdentity = targetSection
        ? (targetSection.markSectionId || targetSection.id).trim()
        : sectionIdToFetch;
      const referenceIdentity = referenceSection
        ? (referenceSection.markSectionId || referenceSection.id).trim()
        : null;
      const isRefreshingReferenceSection =
        !!referenceIdentity && targetIdentity === referenceIdentity;

      try {
        const response = await getSection(sectionIdToFetch);
        const latest = response.result;
        const latestId = latest.id || sectionIdToFetch;
        const latestContent = latest.content || '';
        const latestPackages =
          latest.packages ||
          targetSection?.packages ||
          localPackagesRef.current;

        setEditorSections((prev) => {
          if (!prev?.length) return prev;

          return prev.map((section) => {
            if (
              section.id !== (targetSection?.id || sectionIdToFetch) &&
              section.id !== sectionIdToFetch &&
              section.id !== latestId
            ) {
              return section;
            }

            return {
              ...section,
              id: latestId,
              title: latest.title || section.title,
              content: latestContent,
              packages: latest.packages || section.packages,
              numbered: latest.numbered,
              displayOrder: latest.displayOrder,
              sectionSumary: latest.sectionSumary || '',
              description: latest.description || section.description,
              parentSectionId: latest.parentSectionId ?? null,
              memberId: latest.memberId || section.memberId,
            };
          });
        });

        if (isRefreshingReferenceSection) {
          setReferenceContent(latestContent);
          setSavedReferenceContent(latestContent);
        }

        // Use a functional setter so the comparison is against the live
        // activeSectionId at call-time, not the stale closure value.
        // This is critical when refreshSectionFromServer is called from
        // handleUpdateSectionReference, where activeSectionId may already
        // have been changed to a new version ID by a preceding await.
        setActiveSectionId((currentId) => {
          const isActiveSection =
            currentId === (targetSection?.id || sectionIdToFetch) ||
            currentId === sectionIdToFetch ||
            currentId === latestId;

          if (isActiveSection) {
            previousActiveSectionIdRef.current = latestId;
            // Side-effects inside the functional updater are safe here because
            // this block only runs when the condition is true.
            setContent(latestContent);
            setSavedContent(latestContent);

            if (latestContent) {
              compileAndRender(
                latestContent,
                latestPackages,
                inUseReferenceContent || undefined,
              );
            } else {
              setPdfUrl(null);
              setCompileError(null);
            }

            return latestId;
          }

          return currentId;
        });

        return {
          id: latestId,
          content: latestContent,
          packages: latestPackages,
        };
      } catch {
        // Keep existing content if server sync fails.
        return { id: null, content: '', packages: localPackagesRef.current };
      }
    },
    [compileAndRender, editorSections, inUseReferenceContent, referenceSection],
  );

  const handleUpdateSectionReference = useCallback(
    async (paperBankIds: string[]) => {
      if (!activeSectionId) {
        toast.error('No active section to update reference.');
        return false;
      }
      if (!derivedPaperId) {
        toast.error('Cannot resolve current paper id.');
        return false;
      }

      const extractUpdatedSectionId = (response: unknown): string | null => {
        const record = (response ?? {}) as Record<string, unknown>;
        const result = (record.result ?? {}) as Record<string, unknown>;

        const candidates: unknown[] = [
          result.sectionId,
          result.id,
          (result.section as Record<string, unknown> | undefined)?.id,
          record.sectionId,
          record.id,
        ];

        const found = candidates.find(
          (candidate): candidate is string => typeof candidate === 'string',
        );

        return found ? found.trim() : null;
      };

      const activeSectionSnapshot =
        editorSections?.find((section) => section.id === activeSectionId) ??
        null;

      const markSectionId =
        (activeSectionSnapshot?.markSectionId || '').trim() || activeSectionId;

      // Resolve the latest id from assigned-sections and use it for ALL calls.
      const sectionIdForUpdate =
        (await resolveLatestSectionIdFromAssignedSections(
          markSectionId,
          activeSectionSnapshot,
        )) || activeSectionId;

      try {
        setIsUpdatingReference(true);
        const updateResponse = await updateSectionReferenceForEditor({
          sectionId: sectionIdForUpdate,
          paperId: derivedPaperId,
          paperBankIds,
        });

        // After update, resolve id again from assigned-sections (authoritative).
        let nextSectionId: string | null =
          await resolveLatestSectionIdFromAssignedSections(
            markSectionId,
            activeSectionSnapshot,
            { forceFresh: true },
          );

        // Fallbacks: server may return the new id directly, or we can resolve via mark-section.
        if (!nextSectionId) {
          nextSectionId = extractUpdatedSectionId(updateResponse);
        }
        // No mark-section fallback: assigned-sections is the requested source of truth.

        await queryClient.invalidateQueries({
          queryKey: [
            PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS,
            derivedPaperId,
          ],
          refetchType: 'none',
        });

        const refreshResult = await refreshSectionFromServer(
          nextSectionId || sectionIdForUpdate,
          activeSectionSnapshot,
        );
        toast.success('Reference updated successfully.');

        // Explicitly fetch in-use reference data with the confirmed final ID.
        // This must happen AFTER the PUT so the server returns updated data.
        // We bypass the reload-key effect entirely for this case to avoid the
        // race condition where the effect resolves with a stale section ID.
        const finalSectionId = nextSectionId || sectionIdForUpdate;
        setResolvedActiveSectionId(null); // pause ReferencesTab while we load
        try {
          const inUseData =
            await getSectionReferenceInUseForEditor(finalSectionId);
          setInUsePaperBanks(inUseData.paperBanks);
          setInUseReferenceContent(inUseData.referenceContent);
          // Re-compile with the fresh in-use reference content now that it is
          // available. refreshSectionFromServer compiled with the OLD in-use
          // content (stale closure); this second compile shows the final state.
          if (refreshResult.content) {
            void compileAndRender(
              refreshResult.content,
              refreshResult.packages,
              inUseData.referenceContent || undefined,
            );
          }
        } catch {
          // keep existing in-use data if fetch fails
        }
        // Set the resolved ID so ReferencesTab re-queries with the correct
        // final section ID. Invalidate so it gets fresh data.
        setResolvedActiveSectionId(finalSectionId);
        await queryClient.invalidateQueries({
          queryKey: [
            PAPER_MANAGEMENT_QUERY_KEYS.SECTION_REFERENCE,
            finalSectionId,
          ],
        });
        return true;
      } catch {
        toast.error('Failed to update reference. Please try again.');
        return false;
      } finally {
        setIsUpdatingReference(false);
      }
    },
    [
      activeSectionId,
      editorSections,
      derivedPaperId,
      queryClient,
      compileAndRender,
      refreshSectionFromServer,
      resolveLatestSectionIdFromAssignedSections,
      setResolvedActiveSectionId,
      setInUsePaperBanks,
      setInUseReferenceContent,
    ],
  );
  // Keep the ref in sync so handleAcceptChanges can call this without
  // a forward-declaration issue.
  handleUpdateSectionReferenceRef.current = handleUpdateSectionReference;

  // Auto-render on first mount with the initial section content
  const hasRenderedOnce = useRef(false);
  useEffect(() => {
    if (!hasRenderedOnce.current) {
      hasRenderedOnce.current = true;

      // When section outline is present, preview rendering is handled by section-switch effect.
      if (editorSections?.length) return;

      const initialLatex = content;

      if (initialLatex) {
        compileAndRender(initialLatex);
      }
    }
  }, [content, editorSections, compileAndRender]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setContent(value ?? '');
  }, []);

  const handleOpenFilePicker = useCallback(() => {
    if (!activeSectionId) {
      toast.error('Please select a section before uploading files.');
      return;
    }
    if (isActiveSectionReadOnly) return;
    fileInputRef.current?.click();
  }, [activeSectionId, isActiveSectionReadOnly]);

  const handleFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      event.target.value = '';

      if (!selectedFile || !activeSectionId) return;

      uploadSectionFileMutation.mutate({
        sectionId: activeSectionId,
        file: selectedFile,
      });
    },
    [activeSectionId, uploadSectionFileMutation],
  );

  const handleOpenReferenceSectionInEditor = useCallback(
    (section: SectionReferenceOtherItem['sections'][number]) => {
      setPreviewEditContent(null);
      setVersionPreview(null);
      setActiveSectionId(section.id);
      setIsSidebarRefOpen(false);
      setIsToolsOpen(false);
    },
    [],
  );

  const handleInsertFileUrl = useCallback((fileUrl: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const cursorPosition = cursorPositionRef.current ?? editor.getPosition();
    if (!cursorPosition) return;

    const label = toLatexLabel(fileUrl) || 'image';
    const latexImageBlock = `\n\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.8\\textwidth]{${fileUrl}}\n  \\caption{Image}\n  \\label{fig:${label}}\n\\end{figure}\n`;

    const insertRange = {
      startLineNumber: cursorPosition.lineNumber,
      startColumn: cursorPosition.column,
      endLineNumber: cursorPosition.lineNumber,
      endColumn: cursorPosition.column,
    };

    editor.executeEdits('insert-file-url', [
      { range: insertRange, text: latexImageBlock },
    ]);
    cursorPositionRef.current = editor.getPosition();
    editor.focus();
  }, []);

  const handleCopyFileUrl = useCallback(async (fileUrl: string) => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopiedFileUrl(fileUrl);
      toast.success('File URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  }, []);

  useEffect(() => {
    if (!copiedFileUrl) return;
    const timeoutId = window.setTimeout(() => setCopiedFileUrl(null), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copiedFileUrl]);

  const handleSaveReferenceSection = useCallback(async () => {
    if (!referenceSection) return;
    if (!canEditReferenceSection) {
      toast.error('You do not have permission to edit references.');
      return;
    }

    try {
      await updateSectionMutation.mutateAsync({
        sectionId: referenceSection.id,
        data: {
          sectionId: referenceSection.id,
          memberId: referenceSection.memberId,
          title: referenceSection.title,
          content: referenceContent,
          numbered: referenceSection.numbered,
          sectionSumary: referenceSection.sectionSumary || '',
          parentSectionId: referenceSection.parentSectionId,
          referencesPackages: localRefPackages,
        },
      });

      const markSectionId =
        (referenceSection.markSectionId || referenceSection.id).trim() ||
        referenceSection.id;
      const latestSectionId =
        (await resolveLatestSectionIdFromAssignedSections(
          markSectionId,
          referenceSection,
        )) || referenceSection.id;

      setEditorSections((prev) => {
        if (!prev?.length) return prev;
        return prev.map((section) =>
          section.id === referenceSection.id
            ? {
                ...section,
                id: latestSectionId,
                content: referenceContent,
              }
            : section,
        );
      });

      setSavedReferenceContent(referenceContent);
      setInUseReferenceReloadKey((prev) => prev + 1);

      if (activeSectionId === referenceSection.id) {
        setActiveSectionId(latestSectionId);
        setContent(referenceContent);
        setSavedContent(referenceContent);
      }

      onSave?.(referenceContent, latestSectionId);
    } catch {
      // Mutation error is already handled by mutationConfig onError
    }
  }, [
    referenceSection,
    canEditReferenceSection,
    updateSectionMutation,
    referenceContent,
    localRefPackages,
    resolveLatestSectionIdFromAssignedSections,
    activeSectionId,
    onSave,
    setInUseReferenceReloadKey,
  ]);

  const handleSave = useCallback(async () => {
    if (isActiveSectionReadOnly) {
      toast.error('You do not have permission to edit this section.');
      return;
    }

    // Always read the latest values from refs to avoid stale-closure issues
    // (e.g. section-load effect may have resolved a new id between renders).
    const freshSections = editorSectionsRef.current;
    const freshActiveSection = activeSectionRef.current;
    const freshActiveSectionId = freshActiveSection?.id ?? activeSectionId;

    if (!freshActiveSectionId || !freshSections) {
      toast.error('No section selected to save.');
      return;
    }
    const currentSection =
      freshActiveSection ??
      freshSections.find((s) => s.id === freshActiveSectionId);
    if (!currentSection) {
      toast.error('Section not found.');
      return;
    }
    try {
      // Lock ALL effects immediately — before any async work.
      // This prevents the sections-sync / loadLatestSectionContent /
      // loadInUseReferences effects from overwriting local state during the
      // async gap while we're resolving the section ID and calling mutateAsync.
      saveInProgressRef.current = true;

      const contentToSave =
        previewEditContent !== null ? previewEditContent : content;

      // When editing another member's version preview, save to their section
      const isEditingPreview =
        previewEditContent !== null && versionPreview !== null;
      const targetMemberId = isEditingPreview
        ? versionPreview.item.memberId
        : currentSection.memberId;

      // The stable mark ID for this section (unchanged across versions)
      const markSectionId =
        (currentSection.markSectionId || currentSection.id).trim() ||
        currentSection.id;

      // Resolve the CURRENT version ID from assigned-sections BEFORE saving.
      // freshActiveSectionId may still be the structural ID from allSectionsQuery
      // if loadLatestSectionContent hasn't resolved it yet. The assigned-sections
      // API is the authoritative source for the current version ID per member.
      const resolvedSaveId = isEditingPreview
        ? versionPreview.item.sectionId
        : (await resolveLatestSectionIdFromAssignedSections(
            markSectionId,
            currentSection,
          )) || freshActiveSectionId;

      const targetSectionId = resolvedSaveId;

      await updateSectionMutation.mutateAsync({
        sectionId: targetSectionId,
        data: {
          sectionId: targetSectionId,
          memberId: targetMemberId,
          title: currentSection.title,
          content: contentToSave,
          numbered: currentSection.numbered,
          sectionSumary: currentSection.sectionSumary || '',
          parentSectionId: currentSection.parentSectionId,
          currentSectionPackages: localPackages,
          referencesPackages: localRefPackages,
        },
      });

      // Reflect updated packages into editorSections immediately
      setEditorSections((prev) =>
        prev?.map((s) =>
          s.id === targetSectionId ? { ...s, packages: localPackages } : s,
        ),
      );
      setSavedPackages(localPackages);

      if (isEditingPreview) {
        // Exit preview mode; active section stays unchanged
        setVersionPreview(null);
        setPreviewEditContent(null);
        saveInProgressRef.current = false;
        onSave?.(contentToSave, freshActiveSectionId);
        return;
      }

      // Resolve the post-save version ID via the mark-section version chain.
      let latestSectionId = resolvedSaveId;
      try {
        const markResponse = await getMarkSection(markSectionId);
        const markItems = markResponse.result?.items ?? [];

        // Primary strategy: find the section whose previousVersionSectionId
        // equals the section we just saved. This is the version created by
        // the current save and works for ALL roles (including managers whose
        // memberId is "" in the editor, which makes the old member-filter fail).
        const directSuccessor = markItems.find(
          (item) => item.previousVersionSectionId === resolvedSaveId,
        );

        if (directSuccessor) {
          latestSectionId = directSuccessor.sectionId || resolvedSaveId;
        } else {
          // Fallback: filter by member + role and take the tail of the chain.
          // Used when the backend hasn't linked the predecessor yet (rare race)
          // or when there is no version chain (first save of this section).
          const memberItems = currentSection.memberId
            ? markItems.filter(
                (item) => item.memberId === currentSection.memberId,
              )
            : markItems;
          const roleItems = memberItems.filter(
            (item) => item.sectionRole === currentSection.sectionRole,
          );
          const candidates = roleItems.length ? roleItems : memberItems;
          if (candidates.length) {
            const latest =
              candidates.find((item) => !item.nextVersionSectionId) ??
              candidates[0];
            latestSectionId = latest.sectionId || resolvedSaveId;
          }
        }
      } catch {
        // If mark-section lookup fails, keep the current section ID
      }

      const nextSection: SectionProp = {
        ...currentSection,
        id: latestSectionId,
        content: contentToSave,
      };

      // Update ref BEFORE state to prevent the section-switch effect from re-setting content
      previousActiveSectionIdRef.current = latestSectionId;

      setEditorSections((prev) => {
        if (!prev?.length) return [nextSection];

        const next = [...prev];
        const currentIndex = next.findIndex((s) => s.id === resolvedSaveId);

        if (currentIndex >= 0) {
          next[currentIndex] = nextSection;
        } else {
          next.unshift(nextSection);
        }

        return next;
      });

      setActiveSectionId(latestSectionId);
      setContent(contentToSave);
      setSavedContent(contentToSave);

      // Keep resolvedActiveSectionId in sync with the latest id so the
      // references sidebar doesn't flash "Select a section" after save.
      setResolvedActiveSectionId(latestSectionId);

      // Compile locally with saved content — no need to re-fetch from server
      // since we already have the authoritative content that was just saved.
      void compileAndRender(
        contentToSave,
        localPackages,
        inUseReferenceContent || undefined,
      );

      // Mark assigned-sections stale so next time it's needed it will be fresh
      await queryClient.invalidateQueries({
        queryKey: [
          PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS,
          derivedPaperId,
        ],
        refetchType: 'none',
      });

      // If the AI writing agent suggested references (pendingReferencedPaperIds),
      // commit them now — alongside the content save — so that content and
      // references are persisted atomically from the user's perspective.
      if (
        pendingReferencedPaperIds.length > 0 &&
        handleUpdateSectionReferenceRef.current
      ) {
        await handleUpdateSectionReferenceRef.current(
          pendingReferencedPaperIds,
        );
        setPendingReferencedPaperIds([]);
      }

      // Release the lock AFTER all state updates are committed.
      // Use a microtask to ensure React has flushed the batched state updates
      // before any effect can run with stale data.
      queueMicrotask(() => {
        saveInProgressRef.current = false;
      });

      onSave?.(contentToSave, latestSectionId);
    } catch {
      // Mutation error is already handled by mutationConfig onError
      saveInProgressRef.current = false;
    }
  }, [
    activeSectionId,
    content,
    previewEditContent,
    versionPreview,
    updateSectionMutation,
    onSave,
    isActiveSectionReadOnly,
    resolveLatestSectionIdFromAssignedSections,
    derivedPaperId,
    queryClient,
    compileAndRender,
    inUseReferenceContent,
    localPackages,
    localRefPackages,
    pendingReferencedPaperIds,
  ]);

  const handleClose = useCallback(() => {
    const hasUnsavedMainContent = content !== savedContent;
    const hasUnsavedReferenceContent =
      referenceContent !== savedReferenceContent;
    const hasUnsavedPackages =
      localPackages.length !== savedPackages.length ||
      localPackages.some((p, i) => p !== savedPackages[i]);

    if (
      !isActiveSectionReadOnly &&
      (hasUnsavedMainContent ||
        hasUnsavedReferenceContent ||
        hasUnsavedPackages)
    ) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [
    content,
    savedContent,
    referenceContent,
    savedReferenceContent,
    localPackages,
    savedPackages,
    onClose,
    isActiveSectionReadOnly,
  ]);

  const handleCloseWithoutSaving = useCallback(() => {
    setContent(savedContent);
    setReferenceContent(savedReferenceContent);
    setLocalPackages(savedPackages);
    setPreviewEditContent(null);
    setVersionPreview(null);
    setShowCloseConfirm(false);
    onClose();
  }, [onClose, savedContent, savedReferenceContent, savedPackages]);

  // ESC key to close (with unsaved changes check)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  // Ctrl+S to open save confirm dialog
  useEffect(() => {
    if (isActiveSectionReadOnly) return;
    const handleCtrlS = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSaveConfirm(true);
      }
    };
    document.addEventListener('keydown', handleCtrlS);
    return () => document.removeEventListener('keydown', handleCtrlS);
  }, [isActiveSectionReadOnly]);

  // Ctrl+Enter to render preview
  useEffect(() => {
    if (isActiveSectionReadOnly) return;
    const handleRenderShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleRender();
      }
    };
    document.addEventListener('keydown', handleRenderShortcut, true);
    return () =>
      document.removeEventListener('keydown', handleRenderShortcut, true);
  }, [handleRender, isActiveSectionReadOnly]);

  // Prevent body scroll while editor is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Reset page when PDF changes
  useEffect(() => {
    setPdfPageNum(1);
    setPdfNumPages(0);
  }, [pdfUrl]);

  // Observe PDF container width for responsive page sizing
  useEffect(() => {
    const el = pdfContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      if (isDraggingRef.current) return;
      for (const entry of entries) {
        setPdfContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drag-to-resize separator handler
  const handleSeparatorDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(
        Math.max(((e.clientX - rect.left) / rect.width) * 100, 25),
        75,
      );
      widthPctRef.current = pct;
      if (editorColRef.current) {
        editorColRef.current.style.width = `${pct}%`;
      }
    },
    [],
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Close confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that may be lost. Are you sure you want
              to close?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseWithoutSaving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Close without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Left sidebar */}
      {isSidebarOpen && (
        <div className="flex w-72 shrink-0 flex-col bg-[#f1f1f1] dark:bg-[#1e1e1e]">
          {/* Sidebar header */}
          <div className="flex shrink-0 items-center gap-1 border-b border-[#e5e5e5] px-2 py-2 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={() => setSidebarResourceTab('packages')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                sidebarResourceTab === 'packages'
                  ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Packages
            </button>
            <button
              type="button"
              onClick={() => setSidebarResourceTab('files')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                sidebarResourceTab === 'files'
                  ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Files
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex min-h-0 flex-1 flex-col gap-1 p-2">
            {sidebarResourceTab === 'files' ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                {!isActiveSectionReadOnly && (
                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    disabled={
                      !activeSectionId || uploadSectionFileMutation.isPending
                    }
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1.5 text-[11px] text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    {uploadSectionFileMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    {uploadSectionFileMutation.isPending
                      ? 'Uploading…'
                      : 'Upload Image/File'}
                  </button>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {isActiveSectionReadOnly ? (
                    <p className="mt-2 text-center text-[10px] text-slate-400">
                      Read-only — files hidden.
                    </p>
                  ) : sectionFilesQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                    </div>
                  ) : sectionFiles.length > 0 ? (
                    sectionFiles.map((fileUrl) => {
                      const name = getFileNameFromUrl(fileUrl);
                      const isImg = isImageFileUrl(fileUrl);
                      return (
                        <div
                          key={fileUrl}
                          className="flex items-center gap-1.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {isImg ? (
                            <button
                              type="button"
                              onClick={() => setImagePreviewUrl(fileUrl)}
                              className="h-7 w-7 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
                              title="Preview"
                            >
                              <img
                                src={fileUrl}
                                alt={name}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                            </div>
                          )}
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 flex-1 truncate text-[11px] text-slate-700 hover:underline dark:text-slate-300"
                            title={name}
                          >
                            {name}
                          </a>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {!isActiveSectionReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleInsertFileUrl(fileUrl)}
                                className="rounded-md px-1 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                                title="Insert"
                              >
                                Insert
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyFileUrl(fileUrl)}
                              className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Copy URL"
                            >
                              {copiedFileUrl === fileUrl ? (
                                <span className="text-[10px] text-green-500">
                                  ✓
                                </span>
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="mt-4 text-center text-[10px] text-slate-400">
                      No files uploaded yet.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div
                className={`flex flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${pkgPanelOpen ? 'min-h-0 flex-1' : 'shrink-0'}`}
              >
                <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPkgPanelOpen((v) => !v)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${pkgPanelOpen ? 'rotate-90' : ''}`}
                    />
                    <Package className="h-4 w-4 shrink-0 text-violet-500 dark:text-violet-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Packages
                    </span>
                    {pkgViewTab === 'current' && localPackages.length > 0 && (
                      <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                        {localPackages.length}
                      </span>
                    )}
                    {pkgViewTab === 'reference' &&
                      localRefPackages.length > 0 && (
                        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                          {localRefPackages.length}
                        </span>
                      )}
                  </button>
                  {referenceSection && (
                    <div className="flex overflow-hidden rounded border border-slate-200 text-[10px] dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPkgViewTab('current')}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          pkgViewTab === 'current'
                            ? 'bg-violet-500 text-white'
                            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        Current
                      </button>
                      <button
                        type="button"
                        onClick={() => setPkgViewTab('reference')}
                        className={`px-2 py-0.5 font-medium transition-colors ${
                          pkgViewTab === 'reference'
                            ? 'bg-violet-500 text-white'
                            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        Reference
                      </button>
                    </div>
                  )}
                </div>
                {pkgPanelOpen && (
                  <>
                    {/* Package list */}
                    {pkgViewTab === 'reference' ? (
                      localRefPackages.length > 0 ? (
                        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
                          {localRefPackages.map((pkg, idx) => (
                            <li
                              key={idx}
                              className="group flex items-center gap-1 font-mono text-[12px]"
                            >
                              {editingRefPkgIdx === idx ? (
                                <input
                                  // eslint-disable-next-line jsx-a11y/no-autofocus
                                  autoFocus
                                  type="text"
                                  value={editingRefPkgValue}
                                  onChange={(e) =>
                                    setEditingRefPkgValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      commitRefPkgEdit(idx, editingRefPkgValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingRefPkgIdx(null);
                                      setEditingRefPkgValue('');
                                    }
                                  }}
                                  onBlur={() =>
                                    commitRefPkgEdit(idx, editingRefPkgValue)
                                  }
                                  className="min-w-0 flex-1 rounded border border-violet-400 bg-white px-1.5 py-0.5 font-mono text-[11px] focus:outline-none dark:border-violet-500 dark:bg-slate-800 dark:text-slate-100"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!canEditReferenceSection) return;
                                    setEditingRefPkgIdx(idx);
                                    setEditingRefPkgValue(pkg);
                                  }}
                                  title={
                                    canEditReferenceSection
                                      ? 'Click to edit'
                                      : undefined
                                  }
                                  className="flex-1 truncate text-left text-slate-700 dark:text-slate-300"
                                >
                                  {pkg}
                                </button>
                              )}
                              {canEditReferenceSection &&
                                editingRefPkgIdx !== idx && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLocalRefPackages((prev) =>
                                        prev.filter((_, i) => i !== idx),
                                      )
                                    }
                                    className="invisible h-4 w-4 shrink-0 rounded text-slate-400 group-hover:visible hover:text-red-500"
                                    title="Remove package"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                          <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                            <span className="text-violet-400 dark:text-[#c678dd]">
                              {'% '}
                            </span>
                            no packages on reference section
                          </p>
                        </div>
                      )
                    ) : localPackages.length > 0 ? (
                      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
                        {localPackages.map((pkg, idx) => (
                          <li
                            key={idx}
                            className="group flex items-center gap-1 font-mono text-[12px]"
                          >
                            {editingPkgIdx === idx ? (
                              <input
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                                type="text"
                                value={editingPkgValue}
                                onChange={(e) =>
                                  setEditingPkgValue(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    commitPkgEdit(idx, editingPkgValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingPkgIdx(null);
                                    setEditingPkgValue('');
                                  }
                                }}
                                onBlur={() =>
                                  commitPkgEdit(idx, editingPkgValue)
                                }
                                className="min-w-0 flex-1 rounded border border-violet-400 bg-white px-1.5 py-0.5 font-mono text-[11px] focus:outline-none dark:border-violet-500 dark:bg-slate-800 dark:text-slate-100"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isActiveSectionReadOnly) return;
                                  setEditingPkgIdx(idx);
                                  setEditingPkgValue(pkg);
                                }}
                                title={
                                  isActiveSectionReadOnly
                                    ? undefined
                                    : 'Click to edit'
                                }
                                className="flex-1 truncate text-left text-slate-700 dark:text-slate-300"
                              >
                                {pkg}
                              </button>
                            )}
                            {!isActiveSectionReadOnly &&
                              editingPkgIdx !== idx && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLocalPackages((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  className="invisible h-4 w-4 shrink-0 rounded text-slate-400 group-hover:visible hover:text-red-500"
                                  title="Remove package"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                        <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                          <span className="text-violet-400 dark:text-[#c678dd]">
                            {'% '}
                          </span>
                          no packages defined
                        </p>
                      </div>
                    )}
                    {/* Add package input */}
                    {!isActiveSectionReadOnly && pkgViewTab === 'current' && (
                      <div className="relative shrink-0 border-t border-slate-200 px-2 py-2 dark:border-slate-700">
                        <form
                          className="flex gap-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = newPackageInput.trim();
                            if (!trimmed) return;
                            setLocalPackages((prev) =>
                              prev.includes(trimmed)
                                ? prev
                                : [...prev, trimmed],
                            );
                            setNewPackageInput('');
                          }}
                        >
                          <input
                            type="text"
                            value={newPackageInput}
                            onChange={(e) => setNewPackageInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setNewPackageInput('');
                            }}
                            placeholder="e.g.: \\usepackage{algorithm}"
                            autoComplete="off"
                            className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] placeholder:text-slate-300 focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-600"
                          />
                          <button
                            type="submit"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40"
                            disabled={!newPackageInput.trim()}
                            title="Add package"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </form>
                        {/* Custom suggestion list */}
                        {newPackageInput.trim() &&
                          (() => {
                            const q = newPackageInput.trim().toLowerCase();
                            const suggestions = KNOWN_LATEX_PACKAGES.filter(
                              (p) =>
                                p.toLowerCase().includes(q) &&
                                !localPackages.includes(p) &&
                                !localPackages.some(
                                  (lp) =>
                                    lp !== p &&
                                    extractPackageName(lp) ===
                                      extractPackageName(p),
                                ),
                            );
                            if (!suggestions.length) return null;
                            return (
                              <ul className="absolute right-2 bottom-full left-2 z-50 mb-1 max-h-36 overflow-y-auto rounded border border-slate-200 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800">
                                {suggestions.map((p) => {
                                  const idx = p.toLowerCase().indexOf(q);
                                  return (
                                    <li key={p}>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setLocalPackages((prev) =>
                                            prev.includes(p)
                                              ? prev
                                              : [...prev, p],
                                          );
                                          setNewPackageInput('');
                                        }}
                                        className="w-full px-2 py-1 text-left font-mono text-[11px] hover:bg-violet-50 dark:hover:bg-violet-900/30"
                                      >
                                        {idx >= 0 ? (
                                          <>
                                            <span className="text-slate-500 dark:text-slate-400">
                                              {p.slice(0, idx)}
                                            </span>
                                            <span className="font-bold text-violet-600 dark:text-violet-400">
                                              {p.slice(idx, idx + q.length)}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                              {p.slice(idx + q.length)}
                                            </span>
                                          </>
                                        ) : (
                                          p
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          })()}
                      </div>
                    )}
                    {/* Add package input — Reference section */}
                    {canEditReferenceSection && pkgViewTab === 'reference' && (
                      <div className="relative shrink-0 border-t border-slate-200 px-2 py-2 dark:border-slate-700">
                        <form
                          className="flex gap-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = newRefPackageInput.trim();
                            if (!trimmed) return;
                            setLocalRefPackages((prev) =>
                              prev.includes(trimmed)
                                ? prev
                                : [...prev, trimmed],
                            );
                            setNewRefPackageInput('');
                          }}
                        >
                          <input
                            type="text"
                            value={newRefPackageInput}
                            onChange={(e) =>
                              setNewRefPackageInput(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setNewRefPackageInput('');
                            }}
                            placeholder="Type directly, e.g.: \\usepackage{amsmath}"
                            autoComplete="off"
                            className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] placeholder:text-slate-300 focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-600"
                          />
                          <button
                            type="submit"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40"
                            disabled={!newRefPackageInput.trim()}
                            title="Add package"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </form>
                        {newRefPackageInput.trim() &&
                          (() => {
                            const q = newRefPackageInput.trim().toLowerCase();
                            const suggestions = KNOWN_LATEX_PACKAGES.filter(
                              (p) =>
                                p.toLowerCase().includes(q) &&
                                !localRefPackages.includes(p) &&
                                !localRefPackages.some(
                                  (lp) =>
                                    lp !== p &&
                                    extractPackageName(lp) ===
                                      extractPackageName(p),
                                ),
                            );
                            if (!suggestions.length) return null;
                            return (
                              <ul className="absolute right-2 bottom-full left-2 z-50 mb-1 max-h-36 overflow-y-auto rounded border border-slate-200 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800">
                                {suggestions.map((p) => {
                                  const qi = p.toLowerCase().indexOf(q);
                                  return (
                                    <li key={p}>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setLocalRefPackages((prev) =>
                                            prev.includes(p)
                                              ? prev
                                              : [...prev, p],
                                          );
                                          setNewRefPackageInput('');
                                        }}
                                        className="w-full px-2 py-1 text-left font-mono text-[11px] hover:bg-violet-50 dark:hover:bg-violet-900/30"
                                      >
                                        {qi >= 0 ? (
                                          <>
                                            <span className="text-slate-500 dark:text-slate-400">
                                              {p.slice(0, qi)}
                                            </span>
                                            <span className="font-bold text-violet-600 dark:text-violet-400">
                                              {p.slice(qi, qi + q.length)}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                              {p.slice(qi + q.length)}
                                            </span>
                                          </>
                                        ) : (
                                          p
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {projectId && (
              <div className="flex min-h-0 shrink-0 flex-col border-t border-[#e0e0de] pt-1 dark:border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setIsSidebarRefOpen((v) => !v)}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {isSidebarRefOpen ? (
                    <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
                  ) : (
                    <ChevronRight className="h-3 w-3 transition-transform" />
                  )}
                  References
                </button>
                {isSidebarRefOpen && (
                  <div className="max-h-[45vh] min-h-0 overflow-y-auto px-2 pb-2">
                    <ReferencesTab
                      sectionId={resolvedActiveSectionId ?? undefined}
                      compact
                      onOpenSectionInEditor={handleOpenReferenceSectionInEditor}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Content area: same color as sidebar, no left padding ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f1f1f1] p-2 pl-0 dark:bg-[#1a1a1a]">
        {/* Single outer card wrapping editor + right panel */}
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#d0d0ce] bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
          <div
            ref={containerRef}
            className="flex min-h-0 flex-1 overflow-hidden"
          >
            {/* Editor column — always visible; Save is hidden when readOnly */}
            <div
              ref={editorColRef}
              className="flex shrink-0 flex-col overflow-hidden bg-white dark:bg-[#1e1e1e]"
              style={{ width: `${editorWidthPct}%` }}
            >
              {/* Editor top bar */}
              <div className="flex h-10 shrink-0 items-center border-b border-[#e0e0de] bg-white dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
                {/* Sidebar toggle */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </button>

                {/* Icon + Section title */}
                <div className="flex min-w-0 items-center gap-2 px-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4f6ef7]">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {activeSectionId && editorSections
                      ? activeSectionTitle || paperTitle
                      : paperTitle}
                  </span>
                </div>

                {/* SOURCE — LaTeX indicator */}
                <div className="ml-2 flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#4f6ef7]" />
                  <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    Source — LaTeX
                  </span>
                </div>

                <div className="flex-1" />

                {!isActiveSectionReadOnly && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                        title="Keyboard Shortcuts"
                      >
                        <Keyboard className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="end"
                      className="w-64 p-0"
                    >
                      <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Keyboard Shortcuts
                        </h4>
                      </div>
                      <div className="space-y-1 px-4 py-3 text-sm">
                        {[
                          ['Save', 'Ctrl + S'],
                          ['Compile', 'Ctrl + Enter'],
                          ['Bold', 'Ctrl + B'],
                          ['Italic', 'Ctrl + I'],
                          ['Underline', 'Ctrl + U'],
                          ['Inline Math', 'Ctrl + Shift + M'],
                          ['Display Math', 'Ctrl + Shift + E'],
                          ['Environment', 'Ctrl + Shift + B'],
                          ['Toggle Comment', 'Ctrl + /'],
                          ['Close Editor', 'Esc'],
                        ].map(([label, kbd]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-slate-600 dark:text-slate-400">
                              {label}
                            </span>
                            <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {kbd}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Close editor — shown first so Tools stays near the right edge of text */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="mx-2 flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Close editor"
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>

                {/* Tools toggle */}
                <button
                  type="button"
                  onClick={() => setIsToolsOpen((v) => !v)}
                  className={`mr-2 flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors ${
                    isToolsOpen
                      ? 'bg-[#4fc3a1] text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Tools
                </button>
              </div>

              {/* Monaco Editor — or version preview */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {versionPreview ? (
                  /* ── Version preview banner + editor ── */
                  <>
                    <div className="flex h-8 shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-3 text-xs dark:border-blue-800 dark:bg-blue-950">
                      <span className="flex-1 truncate text-blue-700 dark:text-blue-300">
                        {previewEditContent !== null
                          ? 'Editing version from: '
                          : 'Viewing: '}
                        <strong>
                          {versionPreview.item.isMainSection
                            ? 'Origin section'
                            : versionPreview.item.name ||
                              versionPreview.item.email}
                        </strong>
                        {previewEditContent === null && ' (read-only)'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCloseVersionPreview}
                        className="flex items-center gap-1 rounded px-2 py-0.5 font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back to editing
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {previewEditContent !== null ? (
                        <Editor
                          height="100%"
                          defaultLanguage="latex-custom"
                          value={previewEditContent}
                          onChange={(v) => setPreviewEditContent(v ?? '')}
                          theme="latex-light"
                          beforeMount={registerLatexLanguage}
                          options={{
                            fontSize: 14,
                            lineHeight: 22,
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            padding: { top: 16, bottom: 16 },
                            automaticLayout: true,
                            fontFamily:
                              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                            fontLigatures: true,
                            lineNumbers: 'on',
                            scrollbar: {
                              verticalScrollbarSize: 6,
                              horizontalScrollbarSize: 6,
                              useShadows: false,
                            },
                          }}
                        />
                      ) : (
                        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                        <div
                          className="h-full"
                          onKeyDown={(e) => {
                            if (
                              e.key.length === 1 &&
                              !e.ctrlKey &&
                              !e.metaKey &&
                              !e.altKey
                            ) {
                              const now = Date.now();
                              if (now - lastReadOnlyToastRef.current >= 5000) {
                                lastReadOnlyToastRef.current = now;
                                toast.error('This version is read-only.');
                              }
                            }
                          }}
                        >
                          <Editor
                            height="100%"
                            defaultLanguage="latex-custom"
                            value={versionPreview.item.content || ''}
                            theme="latex-light"
                            beforeMount={registerLatexLanguage}
                            options={{
                              readOnly: true,
                              domReadOnly: true,
                              fontSize: 14,
                              lineHeight: 22,
                              minimap: { enabled: false },
                              wordWrap: 'on',
                              scrollBeyondLastLine: false,
                              padding: { top: 16, bottom: 16 },
                              automaticLayout: true,
                              fontFamily:
                                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                              fontLigatures: true,
                              lineNumbers: 'on',
                              scrollbar: {
                                verticalScrollbarSize: 6,
                                horizontalScrollbarSize: 6,
                                useShadows: false,
                              },
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : pendingWriteOutput !== null ? (
                  /* ── AI Write diff view ── */
                  <>
                    <div className="flex h-9 shrink-0 items-center justify-between border-b border-amber-200 bg-amber-50 px-3 dark:border-amber-800 dark:bg-amber-950">
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        AI has proposed changes to this section
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleRejectChanges}
                          className="rounded px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={handleAcceptChanges}
                          className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                        >
                          Accept Changes
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <WriteDiffView
                        oldText={content}
                        newText={pendingWriteOutput}
                      />
                    </div>
                  </>
                ) : (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div
                    className="h-full"
                    onKeyDown={(e) => {
                      if (
                        isActiveSectionReadOnly &&
                        e.key.length === 1 &&
                        !e.ctrlKey &&
                        !e.metaKey &&
                        !e.altKey
                      ) {
                        const now = Date.now();
                        if (now - lastReadOnlyToastRef.current >= 5000) {
                          lastReadOnlyToastRef.current = now;
                          toast.error(
                            'You do not have permission to edit this section.',
                          );
                        }
                      }
                    }}
                  >
                    <Editor
                      height="100%"
                      defaultLanguage="latex-custom"
                      value={content}
                      onChange={handleEditorChange}
                      theme="latex-light"
                      beforeMount={registerLatexLanguage}
                      onMount={(editor, monaco) => {
                        editorRef.current = editor;
                        cursorPositionRef.current = editor.getPosition();
                        editor.onDidChangeCursorPosition((event) => {
                          cursorPositionRef.current = event.position;
                        });
                        const wrapSelection = (
                          prefix: string,
                          suffix: string,
                        ) => {
                          const selection = editor.getSelection();
                          if (!selection) return;
                          const selectedText =
                            editor.getModel()?.getValueInRange(selection) || '';
                          editor.executeEdits('latex-shortcut', [
                            {
                              range: selection,
                              text: `${prefix}${selectedText}${suffix}`,
                            },
                          ]);
                        };
                        editor.addAction({
                          id: 'latex-bold',
                          label: 'LaTeX Bold',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
                          ],
                          run: () => wrapSelection('\\textbf{', '}'),
                        });
                        editor.addAction({
                          id: 'latex-italic',
                          label: 'LaTeX Italic',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
                          ],
                          run: () => wrapSelection('\\textit{', '}'),
                        });
                        editor.addAction({
                          id: 'latex-underline',
                          label: 'LaTeX Underline',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU,
                          ],
                          run: () => wrapSelection('\\underline{', '}'),
                        });
                        editor.addAction({
                          id: 'latex-inline-math',
                          label: 'LaTeX Inline Math',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd |
                              monaco.KeyMod.Shift |
                              monaco.KeyCode.KeyM,
                          ],
                          run: () => wrapSelection('$', '$'),
                        });
                        editor.addAction({
                          id: 'latex-display-math',
                          label: 'LaTeX Display Math',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd |
                              monaco.KeyMod.Shift |
                              monaco.KeyCode.KeyE,
                          ],
                          run: () => wrapSelection('$$\n', '\n$$'),
                        });
                        editor.addAction({
                          id: 'latex-environment',
                          label: 'LaTeX Environment',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd |
                              monaco.KeyMod.Shift |
                              monaco.KeyCode.KeyB,
                          ],
                          run: () => {
                            const env = prompt(
                              'Enter environment name (e.g. equation, align, itemize):',
                            );
                            if (!env) return;
                            wrapSelection(
                              `\\begin{${env}}\n`,
                              `\n\\end{${env}}`,
                            );
                          },
                        });
                        editor.addAction({
                          id: 'latex-toggle-comment',
                          label: 'LaTeX Toggle Comment',
                          keybindings: [
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
                          ],
                          run: () => {
                            const selection = editor.getSelection();
                            if (!selection) return;
                            const model = editor.getModel();
                            if (!model) return;
                            const edits: MonacoEditor.editor.IIdentifiedSingleEditOperation[] =
                              [];
                            for (
                              let line = selection.startLineNumber;
                              line <= selection.endLineNumber;
                              line++
                            ) {
                              const lineContent = model.getLineContent(line);
                              if (lineContent.trimStart().startsWith('%')) {
                                const idx = lineContent.indexOf('%');
                                const removeExtra =
                                  lineContent[idx + 1] === ' ' ? 2 : 1;
                                edits.push({
                                  range: new monaco.Range(
                                    line,
                                    idx + 1,
                                    line,
                                    idx + 1 + removeExtra,
                                  ),
                                  text: '',
                                });
                              } else {
                                edits.push({
                                  range: new monaco.Range(line, 1, line, 1),
                                  text: '% ',
                                });
                              }
                            }
                            editor.executeEdits('latex-comment', edits);
                          },
                        });
                      }}
                      options={{
                        fontSize: 14,
                        lineHeight: 22,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 },
                        automaticLayout: true,
                        tabSize: 2,
                        renderLineHighlight: 'line',
                        fontFamily:
                          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                        fontLigatures: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        bracketPairColorization: { enabled: true },
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 8,
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        scrollbar: {
                          verticalScrollbarSize: 6,
                          horizontalScrollbarSize: 6,
                          useShadows: false,
                        },
                        readOnly: isActiveSectionReadOnly,
                        domReadOnly: isActiveSectionReadOnly,
                      }}
                    />
                  </div>
                )}
              </div>

              {!versionPreview &&
                referenceSection &&
                !isReferenceSectionActive && (
                  <InlineReferenceSectionEditor
                    content={referenceContent}
                    canEdit={canEditReferenceSection}
                    isDirty={referenceContent !== savedReferenceContent}
                    isSaving={updateSectionMutation.isPending}
                    onChange={(value) => setReferenceContent(value ?? '')}
                    onSave={handleSaveReferenceSection}
                    mode="in-use"
                    usedReferenceContent={inUseReferenceContent}
                    usedPaperBanks={inUsePaperBanks}
                    isUsedReferenceLoading={isInUseReferenceLoading}
                    availablePaperBanks={availableProjectPaperBanks}
                    isAvailablePaperBanksLoading={projectPapersQuery.isLoading}
                    currentPaperId={derivedPaperId}
                    currentSectionId={activeSectionId ?? undefined}
                    currentSectionTitle={activeSectionTitle ?? undefined}
                    onUpdateReference={handleUpdateSectionReference}
                    isUpdatingReference={isUpdatingReference}
                    onActiveReferenceContentChange={setActiveRefContentOverride}
                    isSectionContentDirty={content !== savedContent}
                    onSaveSectionContent={handleSave}
                    isSavingSectionContent={updateSectionMutation.isPending}
                    pendingReferencedPaperIds={pendingReferencedPaperIds}
                  />
                )}

              {/* Save button — bottom of editor */}
              <div className="flex shrink-0 items-center justify-between border-t border-[#e8e8e6] px-4 py-2 dark:border-[#2a2a2a]">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-400">
                    {isActiveSectionReadOnly && previewEditContent === null
                      ? 'Read-only'
                      : previewEditContent !== null
                        ? previewEditContent !== content
                          ? 'Unsaved changes'
                          : 'Saved'
                        : content !== savedContent
                          ? 'Unsaved changes'
                          : 'Saved'}
                  </span>
                  <div className="flex items-center gap-3 border-l border-slate-200 pl-4 text-[10px] text-slate-500 dark:border-slate-700">
                    <span>{latexStats.totalWords} words</span>
                    <span>{latexStats.wordsInHeaders} header words</span>
                    <span>{latexStats.numHeaders} headers</span>
                  </div>
                </div>
                {(!isActiveSectionReadOnly || previewEditContent !== null) && (
                  <AlertDialog
                    open={showSaveConfirm}
                    onOpenChange={setShowSaveConfirm}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded bg-[#4f6ef7] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3d5ce0] disabled:opacity-50"
                        disabled={updateSectionMutation.isPending}
                      >
                        {updateSectionMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        {updateSectionMutation.isPending
                          ? 'Saving…'
                          : 'Save Changes'}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Save</AlertDialogTitle>
                        <AlertDialogDescription>
                          Save changes to this section?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSave}
                          className={BTN.SUCCESS}
                        >
                          Save Changes
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Drag separator — removed, now on right panel edge */}

            {/* Right panel — full height */}
            <div className="relative m-2 flex flex-1 flex-col overflow-hidden rounded-xl bg-[#f1f1f1] dark:bg-[#111111]">
              {/* Drag handle on left edge */}
              {!isActiveSectionReadOnly && (
                <div
                  className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize rounded-l-xl hover:bg-[#4f6ef7]/30 active:bg-[#4f6ef7]/40"
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    isDraggingRef.current = true;
                  }}
                  onPointerMove={handleSeparatorDrag}
                  onPointerUp={() => {
                    isDraggingRef.current = false;
                    setEditorWidthPct(widthPctRef.current);
                    if (pdfContainerRef.current) {
                      setPdfContainerWidth(pdfContainerRef.current.clientWidth);
                    }
                  }}
                />
              )}
              {isToolsOpen ? (
                /* ── Tools panel ── */
                <>
                  <div className="flex h-10 shrink-0 items-center border-b border-[#e5e5e5] bg-[#f1f1f1] dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
                    {/* In readOnly, show sidebar toggle + title */}
                    {isActiveSectionReadOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {isSidebarOpen ? (
                            <PanelLeftClose className="h-4 w-4" />
                          ) : (
                            <PanelLeftOpen className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex min-w-0 items-center gap-2 px-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4f6ef7]">
                            <FileText className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {activeSectionId && editorSections
                              ? activeSectionTitle || paperTitle
                              : paperTitle}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex flex-1 items-center gap-1 overflow-x-auto px-2 [&::-webkit-scrollbar]:hidden">
                      {(
                        [
                          ...(projectId && !isActiveSectionReadOnly
                            ? [
                                {
                                  key: 'chat',
                                  icon: MessageSquareText,
                                  label: 'AI Chat',
                                },
                              ]
                            : []),
                          { key: 'drafts', icon: FileEdit, label: 'Drafts' },
                          { key: 'versions', icon: History, label: 'Versions' },
                          {
                            key: 'comments',
                            icon: MessageSquareText,
                            label: 'Comments',
                          },
                          ...(projectId
                            ? [
                                {
                                  key: 'datasets',
                                  icon: Database,
                                  label: 'Datasets',
                                },
                              ]
                            : []),
                        ] as Array<{
                          key: string;
                          icon: React.ElementType;
                          label: string;
                        }>
                      ).map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setToolsTab(key as typeof toolsTab)}
                          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                            toolsTab === key
                              ? 'border-[#4f6ef7] text-[#4f6ef7]'
                              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Close tools */}
                    <button
                      type="button"
                      onClick={() => setIsToolsOpen(false)}
                      className="mx-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                      title="Close Tools"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {/* Close editor (readOnly only) */}
                    {isActiveSectionReadOnly && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden">
                    {toolsTab === 'versions' && (
                      <VersionsTabPanel
                        paperId={derivedPaperId}
                        paperTitle={paperTitle}
                        onOpenVersionPreview={handleOpenVersionPreview}
                      />
                    )}
                    {toolsTab === 'drafts' && (
                      <DraftsTabPanel
                        markSectionId={activeSectionMarkId}
                        currentUserEmail={currentUserEmail}
                        activeSectionId={activeSectionId}
                        onOpenVersionPreview={handleOpenVersionPreview}
                      />
                    )}
                    {toolsTab === 'comments' && (
                      <div className="flex flex-1 flex-col overflow-hidden">
                        {versionPreview && (
                          <div className="flex shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs dark:border-blue-800 dark:bg-blue-950">
                            <span className="text-blue-600 dark:text-blue-300">
                              Showing comments for{' '}
                              <strong>
                                {versionPreview.item.isMainSection
                                  ? 'Origin section'
                                  : versionPreview.item.name ||
                                    versionPreview.item.email}
                              </strong>
                            </span>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col overflow-hidden p-1">
                          {commentsSectionId ? (
                            <SectionComments
                              sectionId={commentsSectionId}
                              isReadOnly={false}
                              className="flex-1 overflow-hidden"
                            />
                          ) : (
                            <p className="mt-8 text-center text-sm text-slate-400">
                              Select a section to view comments.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {toolsTab === 'chat' && projectId && (
                      <EditorChatPanel
                        projectId={projectId}
                        sectionId={activeSection?.id}
                        sectionTitle={activeSection?.title || paperTitle}
                        sectionContent={content}
                        onWriteOutput={handleWriteOutput}
                      />
                    )}
                    {toolsTab === 'datasets' && projectId && (
                      <div className="flex flex-1 flex-col overflow-y-auto p-4">
                        <DatasetsTab projectId={projectId} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── PDF preview panel (react-pdf) ── */
                <div className="flex flex-1 flex-col overflow-hidden bg-[#f1f1f1] dark:bg-[#111111]">
                  {/* Top toolbar */}
                  <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e5e5] bg-[#f1f1f1] px-3 py-1.5 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
                    {/* readOnly: sidebar toggle + title + divider */}
                    {isActiveSectionReadOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {isSidebarOpen ? (
                            <PanelLeftClose className="h-4 w-4" />
                          ) : (
                            <PanelLeftOpen className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4f6ef7]">
                            <FileText className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="max-w-48 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {activeSectionId && editorSections
                              ? activeSectionTitle || paperTitle
                              : paperTitle}
                          </span>
                        </div>
                        <div className="mx-1 h-4 w-px bg-[#d0d0ce] dark:bg-[#3a3a3a]" />
                      </>
                    )}

                    {/* Compile button — transparent, hover white */}
                    <button
                      type="button"
                      onClick={handleRender}
                      disabled={isCompiling}
                      className="flex h-7 items-center gap-1.5 rounded border border-transparent px-3 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-sm disabled:opacity-50 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-[#333] dark:hover:text-slate-200"
                    >
                      {isCompiling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Compile
                    </button>

                    {/* Divider */}
                    <div className="h-4 w-px bg-[#d0d0ce] dark:bg-[#3a3a3a]" />

                    {/* Page navigation */}
                    {pdfNumPages > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={pdfPageNum <= 1}
                          onClick={() =>
                            setPdfPageNum((p) => Math.max(1, p - 1))
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#333]"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-14 text-center text-xs text-slate-600 tabular-nums dark:text-slate-400">
                          <span className="font-semibold text-[#1a6b4e] dark:text-[#4fc3a1]">
                            {String(pdfPageNum).padStart(2, '0')}
                          </span>{' '}
                          of {String(pdfNumPages).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          disabled={pdfPageNum >= pdfNumPages}
                          onClick={() =>
                            setPdfPageNum((p) => Math.min(pdfNumPages, p + 1))
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white disabled:opacity-30 dark:text-slate-400 dark:hover:bg-[#333]"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <div className="h-4 w-px bg-[#d0d0ce] dark:bg-[#3a3a3a]" />
                      </>
                    )}

                    {/* Zoom controls */}
                    {pdfUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPdfZoom((z) => Math.max(25, z - 25))
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#333]"
                          title="Zoom out"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-10 text-center text-[10px] text-slate-500 dark:text-slate-400">
                          {pdfZoom}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPdfZoom((z) => Math.min(200, z + 25))
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#333]"
                          title="Zoom in"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfZoom(100)}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-[#333]"
                          title="Reset zoom"
                        >
                          Fit
                        </button>
                      </>
                    )}

                    <div className="flex-1" />

                    {/* Download */}
                    {pdfUrl && (
                      <a
                        href={pdfUrl}
                        download="preview.pdf"
                        className="flex h-7 items-center gap-1.5 rounded border border-transparent px-2 text-xs text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-[#333]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    )}

                    {/* Tools toggle (readOnly: always show; non-readOnly: also show in PDF toolbar) */}
                    {isActiveSectionReadOnly && (
                      <button
                        type="button"
                        onClick={() => setIsToolsOpen(true)}
                        className="flex h-7 items-center gap-1.5 rounded border border-transparent px-2.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-sm dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-[#333] dark:hover:text-slate-200"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Tools
                      </button>
                    )}

                    {/* Close editor (readOnly only) */}
                    {isActiveSectionReadOnly && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mx-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* PDF page area */}
                  <div
                    ref={pdfContainerRef}
                    className="flex flex-1 overflow-auto"
                  >
                    <div className="mx-auto flex min-h-full w-fit flex-col items-center px-6 py-6">
                      {isCompiling ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-[#4fc3a1]" />
                          <span className="text-sm text-slate-500">
                            Compiling LaTeX…
                          </span>
                        </div>
                      ) : compileError ? (
                        <div className="mx-auto w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                          <p className="font-semibold">Compilation Error</p>
                          <pre className="mt-2 max-h-60 overflow-auto text-xs whitespace-pre-wrap">
                            {compileError}
                          </pre>
                        </div>
                      ) : pdfUrl ? (
                        <Document
                          file={pdfUrl}
                          onLoadSuccess={({ numPages }) =>
                            setPdfNumPages(numPages)
                          }
                          loading={
                            <div className="flex flex-col items-center gap-3 py-16">
                              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                              <span className="text-xs text-slate-400">
                                Loading PDF…
                              </span>
                            </div>
                          }
                          error={
                            <div className="flex flex-col items-center gap-3 py-16">
                              <p className="text-sm text-red-500">
                                Failed to load PDF
                              </p>
                              <a
                                href={pdfUrl}
                                download="preview.pdf"
                                className="text-sm font-medium text-blue-600 underline"
                              >
                                Download instead
                              </a>
                            </div>
                          }
                          className="flex flex-col items-center gap-6"
                        >
                          <Page
                            pageNumber={pdfPageNum}
                            width={
                              pdfContainerWidth > 64
                                ? Math.min(pdfContainerWidth - 48, 900) *
                                  (pdfZoom / 100)
                                : undefined
                            }
                            className="rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                            renderAnnotationLayer
                            renderTextLayer
                          />
                        </Document>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                            <Play className="h-7 w-7 text-slate-300" />
                          </div>
                          <span className="text-sm text-slate-400">
                            Click <strong>Compile</strong> to preview PDF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* close right panel */}
          </div>
          {/* close row */}
        </div>
        {/* close outer card */}
      </div>
      {/* close content area */}
      {/* Image lightbox */}
      <Dialog
        open={!!imagePreviewUrl}
        onOpenChange={(open) => {
          if (!open) setImagePreviewUrl(null);
        }}
      >
        <DialogContent className="max-w-4xl p-2">
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt={getFileNameFromUrl(imagePreviewUrl)}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
