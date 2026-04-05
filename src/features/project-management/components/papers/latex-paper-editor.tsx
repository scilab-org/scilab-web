import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import Editor, { type Monaco } from '@monaco-editor/react';
import type * as MonacoEditor from 'monaco-editor';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  X,
  FileText,
  Save,
  Play,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  Loader2,
  Keyboard,
  Copy,
  MessageSquareText,
  BookOpen,
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
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  type SectionReferenceOtherItem,
  useGetSectionReference,
} from '@/features/paper-management/api/get-section-reference';
import { useUpdateSection } from '@/features/paper-management/api/update-section';
import { compileLatex } from '@/features/paper-management/api/compile-latex';
import {
  getMarkSection,
  useMarkSection,
} from '@/features/paper-management/api/get-mark-section';
import { useGetSectionFiles } from '@/features/paper-management/api/get-section-files';
import { useUploadSectionFile } from '@/features/paper-management/api/upload-section-file';
import { useSectionComments } from '@/features/paper-management/api/get-section-comments';
import { SectionComments } from '@/features/paper-management/components/section-comments';
import { PaperOldSectionsManager } from '@/features/paper-management/components/paper-old-sections-manager';
import { useDatasets } from '@/features/dataset-management/api/get-datasets';
import { useUser } from '@/lib/auth';

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

type MarkSectionItem = {
  sectionId: string;
  name: string;
  email: string;
  memberId: string;
  sectionRole: string;
  isMainSection: boolean;
  content: string;
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
  const query = useMarkSection({ markSectionId: markSectionId || null });
  const allItems: MarkSectionItem[] = query.data?.result?.items ?? [];

  const items = allItems.filter((i) => {
    if (i.isMainSection) return true;
    if (excludeSectionId && i.sectionId === excludeSectionId) return false;
    if ((i.email || '').toLowerCase() === currentUserEmail.toLowerCase())
      return false;
    return true;
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-xs text-slate-400">
        Loading contributors...
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
    <div className="flex flex-col">
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
            className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800/60 dark:active:bg-slate-800"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform duration-150 group-hover:scale-105 ${
                item.isMainSection
                  ? 'bg-emerald-500'
                  : COLORS[idx % COLORS.length]
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {displayName}
                </span>
              </div>
              {!item.isMainSection && (
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                  {item.email}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600" />
          </button>
        );
      })}
    </div>
  );
};

const VersionsTabPanel = ({
  paperId,
  paperTitle,
  markSectionId,
  currentUserEmail,
  activeSectionId,
  onOpenVersionPreview,
}: {
  paperId: string;
  paperTitle: string;
  markSectionId: string;
  currentUserEmail: string;
  activeSectionId: string | null;
  onOpenVersionPreview: (item: MarkSectionItem) => void;
}) => {
  const [view, setView] = useState<'old' | 'others'>('others');

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <select
          value={view}
          onChange={(e) => setView(e.target.value as 'old' | 'others')}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="old">Old Versions</option>
          <option value="others">Other Versions</option>
        </select>
      </div>

      {view === 'old' ? (
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
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {markSectionId ? (
            <SectionVersionsPanel
              markSectionId={markSectionId}
              currentUserEmail={currentUserEmail}
              excludeSectionId={activeSectionId ?? undefined}
              onViewItem={(item) => onOpenVersionPreview(item)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-xs text-slate-400">
              No section context for other versions.
            </div>
          )}
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
                      Metadata
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
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

export const LatexPaperEditor = ({
  paperTitle,
  projectId,
  draftStorageScope,
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
    'chat' | 'versions' | 'comments' | 'info' | 'datasets'
  >('chat');
  const [isSidebarRefOpen, setIsSidebarRefOpen] = useState(false);
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
  const [copiedFileUrl, setCopiedFileUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const cursorPositionRef = useRef<CursorPosition | null>(null);
  const previousActiveSectionIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastReadOnlyToastRef = useRef<number>(0);

  const draftStorageKey = useMemo(() => {
    if (draftStorageScope) return `latex-editor-drafts:${draftStorageScope}`;

    const derivedPaperId = sections?.[0]?.paperId || 'paper';
    const derivedProjectId = projectId || 'workspace';
    return `latex-editor-drafts:${derivedProjectId}:${derivedPaperId}`;
  }, [draftStorageScope, projectId, sections]);

  const getDraftMap = useCallback((): Record<string, string> => {
    if (typeof window === 'undefined') return {};

    try {
      const raw = sessionStorage.getItem(draftStorageKey);
      if (!raw) return {};

      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }

      return parsed as Record<string, string>;
    } catch {
      return {};
    }
  }, [draftStorageKey]);

  const setDraftMap = useCallback(
    (next: Record<string, string>) => {
      if (typeof window === 'undefined') return;

      try {
        if (Object.keys(next).length === 0) {
          sessionStorage.removeItem(draftStorageKey);
          return;
        }

        sessionStorage.setItem(draftStorageKey, JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
    },
    [draftStorageKey],
  );

  const getSectionDraft = useCallback(
    (sectionId: string): string | null => {
      const draftMap = getDraftMap();
      const value = draftMap[sectionId];
      return typeof value === 'string' ? value : null;
    },
    [getDraftMap],
  );

  const setSectionDraft = useCallback(
    (sectionId: string, value: string) => {
      const draftMap = getDraftMap();
      draftMap[sectionId] = value;
      setDraftMap(draftMap);
    },
    [getDraftMap, setDraftMap],
  );

  const clearSectionDraft = useCallback(
    (sectionId: string) => {
      const draftMap = getDraftMap();
      if (!(sectionId in draftMap)) return;

      delete draftMap[sectionId];
      setDraftMap(draftMap);
    },
    [getDraftMap, setDraftMap],
  );

  useEffect(() => {
    setEditorSections(sections);
  }, [sections]);

  useEffect(() => {
    const fallbackSectionId = initialSectionId || sections?.[0]?.id || null;
    if (!fallbackSectionId) return;

    setActiveSectionId((prev) => {
      if (!sections?.length) return prev ?? fallbackSectionId;
      if (prev && sections.some((section) => section.id === prev)) {
        return prev;
      }
      return fallbackSectionId;
    });
  }, [initialSectionId, sections]);

  const activeSection =
    editorSections?.find((section) => section.id === activeSectionId) ?? null;
  const activeSectionTitle =
    editorSections?.find((section) => section.id === activeSectionId)?.title ??
    null;

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

  // Derive paperId from sections for version history
  const derivedPaperId =
    activeSection?.paperId || editorSections?.[0]?.paperId || '';

  // Active section's markSectionId for contributor list
  const activeSectionMarkId =
    activeSection?.markSectionId || activeSectionId || '';

  // Current user for "me" badges
  const { data: currentUser } = useUser();
  const currentUserEmail = (currentUser?.email || '').toLowerCase();

  // LaTeX stats computed from current content
  const latexStats = useMemo(() => computeLatexStats(content), [content]);

  const sectionFilesQuery = useGetSectionFiles({
    sectionId: activeSectionId,
    enabled: !!activeSectionId && !isActiveSectionReadOnly,
  });
  const sectionFiles = isActiveSectionReadOnly
    ? []
    : (sectionFilesQuery.data ?? []);

  useSectionComments({
    sectionId: activeSectionId ?? '',
    queryConfig: {
      enabled: !!activeSectionId,
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
        toast.success('Section saved successfully');
      },
      onError: () => {
        toast.error('Failed to save section. Please try again.');
      },
    },
  });

  const compileAndRender = useCallback(async (latexContent: string) => {
    setIsCompiling(true);
    setCompileError(null);
    try {
      const blob = await compileLatex({ content: latexContent });
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      const newUrl = URL.createObjectURL(blob);
      pdfUrlRef.current = newUrl;
      setPdfUrl(newUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to compile LaTeX';
      setCompileError(message);
      toast.error('LaTeX compilation failed');
    } finally {
      setIsCompiling(false);
    }
  }, []);

  // Compile LaTeX to PDF via API
  const handleRender = useCallback(() => {
    if (versionPreview) {
      compileAndRender(previewEditContent ?? versionPreview.item.content ?? '');
      return;
    }
    if (isActiveSectionReadOnly) return;
    compileAndRender(content);
  }, [
    content,
    previewEditContent,
    versionPreview,
    compileAndRender,
    isActiveSectionReadOnly,
  ]);

  // Clean up PDF blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  // When sections or activeSectionId changes, load content into editor
  useEffect(() => {
    if (editorSections && activeSectionId) {
      const activeSection = editorSections.find(
        (s) => s.id === activeSectionId,
      );
      if (activeSection) {
        const isSectionSwitched =
          previousActiveSectionIdRef.current !== activeSectionId;

        // Only reset content when actually switching sections to avoid jank on save
        if (isSectionSwitched) {
          const persistedDraft = getSectionDraft(activeSectionId);
          const serverContent = activeSection.content || '';
          const nextContent = persistedDraft ?? serverContent;

          setContent(nextContent);
          setSavedContent(activeSection.content || '');
          if (nextContent) {
            compileAndRender(nextContent);
          } else {
            setPdfUrl(null);
            setCompileError(null);
          }
          previousActiveSectionIdRef.current = activeSectionId;
        }
      }
    }
  }, [editorSections, activeSectionId, compileAndRender, getSectionDraft]);

  useEffect(() => {
    if (!activeSectionId || versionPreview) return;

    if (content === savedContent) {
      clearSectionDraft(activeSectionId);
      return;
    }

    setSectionDraft(activeSectionId, content);
  }, [
    activeSectionId,
    clearSectionDraft,
    content,
    savedContent,
    setSectionDraft,
    versionPreview,
  ]);

  useEffect(() => {
    if (!editorSections?.length && sidebarTab !== 'files') {
      setSidebarTab('files' as const);
    }
  }, [editorSections, sidebarTab]);

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
      setVersionPreview({
        item: {
          sectionId: section.id,
          name: section.createdBy || 'Reference section',
          email: '',
          memberId: 'reference',
          sectionRole: 'reference:readonly',
          isMainSection: false,
          content: section.content || '',
        },
        returnSectionId: activeSectionId,
      });
      setIsSidebarRefOpen(false);
      setIsToolsOpen(false);
    },
    [activeSectionId],
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

  const resolveLatestSectionId = useCallback(async (section: SectionProp) => {
    const markSectionId = section.markSectionId || section.id;

    try {
      const response = await getMarkSection(markSectionId);
      const items = response.result?.items ?? [];

      const sameMemberItems = items.filter(
        (item) => item.memberId === section.memberId,
      );
      const sameRoleItems = sameMemberItems.filter(
        (item) => item.sectionRole === section.sectionRole,
      );
      const candidates = sameRoleItems.length ? sameRoleItems : sameMemberItems;

      if (!candidates.length) return section.id;

      const latest =
        candidates.find((item) => !item.nextVersionSectionId) ?? candidates[0];

      return latest.sectionId || section.id;
    } catch {
      return section.id;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (isActiveSectionReadOnly) {
      toast.error('You do not have permission to edit this section.');
      return;
    }
    if (!activeSectionId || !editorSections) {
      toast.error('No section selected to save.');
      return;
    }
    const currentSection = editorSections.find((s) => s.id === activeSectionId);
    if (!currentSection) {
      toast.error('Section not found.');
      return;
    }
    try {
      const contentToSave =
        previewEditContent !== null ? previewEditContent : content;

      // When editing another member's version preview, save to their section
      const isEditingPreview =
        previewEditContent !== null && versionPreview !== null;
      const targetSectionId = isEditingPreview
        ? versionPreview.item.sectionId
        : activeSectionId;
      const targetMemberId = isEditingPreview
        ? versionPreview.item.memberId
        : currentSection.memberId;

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
        },
      });

      if (isEditingPreview) {
        clearSectionDraft(targetSectionId);
        // Exit preview mode; active section stays unchanged
        setVersionPreview(null);
        setPreviewEditContent(null);
        onSave?.(contentToSave, activeSectionId);
        return;
      }

      const latestSectionId = await resolveLatestSectionId(currentSection);
      const nextSection: SectionProp = {
        ...currentSection,
        id: latestSectionId,
        content: contentToSave,
      };

      clearSectionDraft(activeSectionId);
      if (latestSectionId !== activeSectionId) {
        clearSectionDraft(latestSectionId);
      }

      // Update ref BEFORE state to prevent the section-switch effect from re-setting content
      previousActiveSectionIdRef.current = latestSectionId;

      setEditorSections((prev) => {
        if (!prev?.length) return [nextSection];

        const next = [...prev];
        const currentIndex = next.findIndex((s) => s.id === activeSectionId);

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
      onSave?.(contentToSave, latestSectionId);
    } catch {
      // Mutation error is already handled by mutationConfig onError
    }
  }, [
    activeSectionId,
    editorSections,
    content,
    previewEditContent,
    versionPreview,
    updateSectionMutation,
    onSave,
    isActiveSectionReadOnly,
    resolveLatestSectionId,
    clearSectionDraft,
  ]);

  const handleClose = useCallback(() => {
    if (!isActiveSectionReadOnly && content !== savedContent) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [content, savedContent, onClose, isActiveSectionReadOnly]);

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
              onClick={onClose}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Close without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Left sidebar — Files only */}
      {isSidebarOpen && (
        <div className="flex w-72 shrink-0 flex-col bg-[#f1f1f1] dark:bg-[#1e1e1e]">
          {/* Sidebar header */}
          <div className="flex shrink-0 items-center border-b border-[#e5e5e5] px-3 py-2 dark:border-[#2a2a2a]">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Files
            </span>
          </div>

          {/* Sidebar content */}
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
            {/* Upload button */}
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

            {/* File list */}
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
                          <span className="text-[10px] text-green-500">✓</span>
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

          {/* ── References collapsible (like Outline in Prism) ── */}
          {projectId && (
            <div className="shrink-0 border-t border-[#e0e0de] dark:border-[#2a2a2a]">
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
                <div className="max-h-136 overflow-y-auto px-2 pb-2">
                  <ReferencesTab
                    sectionId={activeSectionId ?? undefined}
                    compact
                    onOpenSectionInEditor={handleOpenReferenceSectionInEditor}
                  />
                </div>
              )}
            </div>
          )}
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

              {/* Save button — bottom of editor */}
              <div className="flex shrink-0 items-center justify-between border-t border-[#e8e8e6] px-4 py-2 dark:border-[#2a2a2a]">
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
                          { key: 'versions', icon: History, label: 'Versions' },
                          {
                            key: 'comments',
                            icon: MessageSquareText,
                            label: 'Comments',
                          },
                          { key: 'info', icon: BookOpen, label: 'Paper Info' },
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
                    {toolsTab === 'info' && (
                      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Words', value: latexStats.totalWords },
                            {
                              label: 'Words in Text',
                              value: latexStats.wordsInText,
                            },
                            {
                              label: 'Words in Headers',
                              value: latexStats.wordsInHeaders,
                            },
                            { label: 'Words outside text', value: 0 },
                            {
                              label: 'Number of headers',
                              value: latexStats.numHeaders,
                            },
                            {
                              label: 'Number of figures',
                              value: latexStats.numFigures,
                            },
                            {
                              label: 'Number of math inlines',
                              value: latexStats.numMathInlines,
                            },
                            {
                              label: 'Number of math displayed',
                              value: latexStats.numMathDisplayed,
                            },
                          ].map(({ label, value }) => (
                            <div
                              key={label}
                              className="rounded-lg border border-slate-100 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                {label}
                              </p>
                              <p className="mt-0.5 text-xl font-bold text-slate-800 dark:text-slate-200">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {toolsTab === 'versions' && (
                      <VersionsTabPanel
                        paperId={derivedPaperId}
                        paperTitle={paperTitle}
                        markSectionId={activeSectionMarkId}
                        currentUserEmail={currentUserEmail}
                        activeSectionId={activeSectionId}
                        onOpenVersionPreview={handleOpenVersionPreview}
                      />
                    )}
                    {toolsTab === 'comments' && (
                      <div className="flex flex-1 flex-col overflow-hidden p-1">
                        {activeSectionId ? (
                          <SectionComments
                            sectionId={activeSectionId}
                            isReadOnly={isActiveSectionReadOnly}
                            className="flex-1 overflow-hidden"
                          />
                        ) : (
                          <p className="mt-8 text-center text-sm text-slate-400">
                            Select a section to view comments.
                          </p>
                        )}
                      </div>
                    )}
                    {toolsTab === 'chat' && projectId && (
                      <EditorChatPanel
                        projectId={projectId}
                        sectionTitle={activeSection?.title || paperTitle}
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
