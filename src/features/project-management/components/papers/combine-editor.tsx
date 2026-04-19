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
  Save,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Copy,
  Download,
  Minus,
  Plus,
  Eye,
  MessageSquareText,
  BookMarked,
  Pencil,
  Lock,
  FileText,
  X,
  RefreshCw,
  LayoutGrid,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

import { compileLatex } from '@/features/paper-management/api/compile-latex';
import { useCombinePaper } from '@/features/paper-management/api/combine-paper';
import { useUpdateCombineVersion } from '@/features/paper-management/api/update-combine-version';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import {
  previewSectionReference,
  type PreviewReferencePaperBank,
} from '@/features/paper-management/api/preview-section-reference';
import type { CombineDto } from '@/features/paper-management/types';

import { EditorChatPanel } from './editor-chat-panel';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Throttled toast helper – same message won't re-appear within 3 s
const _lastToastMap = new Map<string, number>();
const throttledToast = {
  error(msg: string) {
    const now = Date.now();
    const prev = _lastToastMap.get(msg) ?? 0;
    if (now - prev < 3000) return;
    _lastToastMap.set(msg, now);
    toast.error(msg);
  },
  success(msg: string) {
    toast.success(msg);
  },
};

// ─── Register custom latex language & light theme (same as section editor) ───
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
        [/%.*$/, 'comment'],
        [/\$\$/, { token: 'delimiter.math', next: '@mathDisplay' }],
        [/\$/, { token: 'delimiter.math', next: '@mathInline' }],
        [
          /(\\(?:begin|end))(\{)([^}]*)(\})/,
          ['keyword', 'delimiter.curly', 'type.identifier', 'delimiter.curly'],
        ],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/\\./, 'keyword'],
        [/[{}]/, 'delimiter.curly'],
        [/\[/, 'delimiter.square'],
        [/\]/, 'delimiter.square'],
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

  monaco.editor.defineTheme('latex-light', {
    base: 'vs',
    inherit: true,
    semanticHighlighting: false,
    rules: [
      { token: 'keyword', foreground: '2f6b5b', fontStyle: '' },
      { token: 'string.math', foreground: '000000', fontStyle: '' },
      { token: 'delimiter.math', foreground: '000000', fontStyle: '' },
      { token: 'type.identifier', foreground: '000000', fontStyle: '' },
      { token: 'delimiter.curly', foreground: '000000', fontStyle: '' },
      { token: 'delimiter.square', foreground: '000000', fontStyle: '' },
      { token: 'comment', foreground: '000000', fontStyle: '' },
      { token: 'number', foreground: '000000', fontStyle: '' },
    ],
    colors: {
      'editor.background': '#fffaf1',
      'editor.foreground': '#000000',
      'editorCursor.foreground': '#2f6b5b',
      'editor.selectionBackground': '#dbeafe',
      'editor.inactiveSelectionBackground': '#e2e8f0',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editorIndentGuide.background': '#ede8df',
      'editorIndentGuide.activeBackground': '#d9d0c4',
      'editorBracketMatch.background': '#dbeafe',
    },
  });
};

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
    numHeaders,
    numFigures,
    numMathInlines,
    numMathDisplayed,
  };
};

// ─── Reference detail dialog ─────────────────────────────────────────────────
const ReferenceDetailDialog = ({
  paper,
  index,
  onClose,
}: {
  paper: PreviewReferencePaperBank;
  index: number;
  onClose: () => void;
}) => {
  const year = paper.publicationDate
    ? new Date(paper.publicationDate).getFullYear()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                In use
              </span>
              {paper.tagNames.length > 0 && (
                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {paper.tagNames.length} tag
                  {paper.tagNames.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h2 className="text-base leading-snug font-semibold text-slate-900 dark:text-slate-100">
              {paper.title ?? `Reference [${index + 1}]`}
            </h2>
            <p className="text-xs text-slate-400">
              Reference currently used in this section
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-y-auto p-5">
          {/* Left: Abstract */}
          <div className="flex flex-1 flex-col gap-3">
            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Abstract
                </span>
                <span className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Preview
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {paper.abstract ?? 'No abstract available.'}
              </p>
            </div>
          </div>

          {/* Right: Information */}
          <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Information
            </span>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Authors
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-200">
                  {paper.authors ?? 'Not provided'}
                </div>
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Publisher
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {paper.publisher?.trim() || 'Not provided'}
                </div>
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Journal / Conference
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {paper.journalName?.trim() ||
                    paper.conferenceName?.trim() ||
                    'Not provided'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Year
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {year ?? 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Sections
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">0</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Volume
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {paper.volume?.trim() || 'Not provided'}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Number
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {paper.number?.trim() || 'Not provided'}
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Pages
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {paper.pages?.trim() || 'Not provided'}
                </div>
              </div>
              {paper.doi && (
                <div>
                  <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    DOI
                  </div>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-500 hover:underline"
                  >
                    {paper.doi}
                  </a>
                </div>
              )}
              {paper.tagNames.length > 0 && (
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {paper.tagNames.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {paper.filePath && (
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <a
              href={paper.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <FileText className="h-4 w-4" />
              Open file
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── References Panel: extracts paperBankIds from paper.references, calls POST /sections/reference/preview
const CombineReferencesPanel = ({ paperId }: { paperId: string }) => {
  const [paperBanks, setPaperBanks] = useState<PreviewReferencePaperBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<{
    paper: PreviewReferencePaperBank;
    index: number;
  } | null>(null);

  const paperQuery = useWritingPaperDetail({
    paperId,
    queryConfig: { enabled: !!paperId },
  });

  const paperBankIds = useMemo(() => {
    const refs = paperQuery.data?.result?.paper?.references ?? [];
    return Array.from(new Set(refs.map((r) => r.paperBankId).filter(Boolean)));
  }, [paperQuery.data]);

  useEffect(() => {
    if (paperQuery.isLoading) return;
    if (!paperBankIds.length) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const result = await previewSectionReference(paperBankIds);
        if (cancelled) return;
        setPaperBanks(result.result.paperBanks);
      } catch {
        if (cancelled) return;
        setPaperBanks([]);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [paperBankIds, paperQuery.isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading references…
      </div>
    );
  }

  if (!paperBanks.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <BookMarked className="h-7 w-7 text-slate-300 dark:text-slate-600" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No references in use across sections.
        </p>
      </div>
    );
  }

  return (
    <>
      {selectedPaper && (
        <ReferenceDetailDialog
          paper={selectedPaper.paper}
          index={selectedPaper.index}
          onClose={() => setSelectedPaper(null)}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            In use ({paperBanks.length})
          </span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {paperBanks.map((bank, i) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => setSelectedPaper({ paper: bank, index: i })}
              className="bg-editor-content-bg flex w-full items-start gap-2.5 rounded-lg border border-[#e0e0de] p-3 text-left transition-colors hover:border-[#cfc4b3] hover:bg-[#f7f1e7] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {i + 1}
              </span>
              <div className="flex-1 overflow-hidden">
                <p className="line-clamp-3 text-xs leading-snug font-medium text-slate-700 dark:text-slate-200">
                  {bank.title ?? `Reference ${i + 1}`}
                </p>
                {(bank.journalName || bank.conferenceName) && (
                  <p className="mt-1 truncate text-[11px] text-slate-400 italic">
                    {bank.journalName || bank.conferenceName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── Main Combine Editor Component ────────────────────────────────────────

export type CombineEditorProps = {
  paperId: string;
  combineId: string;
  projectId: string;
  subProjectId: string;
  combine: CombineDto;
  paperTitle: string;
  isAuthor?: boolean;
  initialEditMode?: boolean;
  onClose: () => void;
};

export const CombineEditor = ({
  paperId,
  combineId,
  projectId,
  subProjectId,
  combine,
  paperTitle,
  isAuthor = false,
  initialEditMode = false,
  onClose,
}: CombineEditorProps) => {
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [content, setContent] = useState(combine.content ?? '');
  const [savedContent, setSavedContent] = useState(combine.content ?? '');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [editorWidthPct, setEditorWidthPct] = useState(50);
  const [pdfZoom, setPdfZoom] = useState(100);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorColRef = useRef<HTMLDivElement>(null);
  const widthPctRef = useRef(50);
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const isReadOnly = !isEditMode && (combine.isSave ?? true);
  const hasChanges = content !== savedContent;

  // Save handler: POST combine with isPreview=false (only when isSave=false)
  const saveMutation = useCombinePaper({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Saved successfully');
        onClose();
      },
      onError: () => throttledToast.error('Failed to save'),
    },
  });

  const updateMutation = useUpdateCombineVersion({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Updated successfully');
        setSavedContent(content);
      },
      onError: () => throttledToast.error('Failed to update'),
    },
  });

  // PDF container width observer
  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPdfContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compile LaTeX to PDF
  const handleCompile = useCallback(async () => {
    if (!content.trim()) {
      throttledToast.error('Nothing to compile.');
      return;
    }
    setIsCompiling(true);
    setCompileError(null);
    try {
      const blob = await compileLatex({ content });
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfUrl(url);
      setPdfPageNum(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Compilation failed';
      setCompileError(message);
      throttledToast.error('Compilation failed');
    } finally {
      setIsCompiling(false);
    }
  }, [content]);

  // Auto-compile on mount

  useEffect(() => {
    if (combine.content?.trim()) {
      handleCompile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  // Update handler: PUT /papers/{paperId}/versions/{versionId}/combine
  const handleUpdate = useCallback(() => {
    updateMutation.mutate({
      paperId,
      versionId: combineId,
      data: { content, projectId: subProjectId },
    });
  }, [paperId, combineId, content, subProjectId, updateMutation]);

  // Save handler: POST combine isPreview=false
  const handleSave = useCallback(() => {
    saveMutation.mutate({
      paperId,
      data: { isPreview: false, content, projectId: subProjectId },
    });
  }, [paperId, content, subProjectId, saveMutation]);

  // Divider drag handler (pointer-based)
  const handleSeparatorDrag = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(20, Math.min(80, pct));
    widthPctRef.current = clamped;
    if (editorColRef.current) {
      editorColRef.current.style.width = `${clamped}%`;
    }
  }, []);

  // Stats
  const stats = useMemo(() => computeLatexStats(content), [content]);

  // PDF download
  const handleDownloadPdf = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${paperTitle || 'combined'}.pdf`;
    a.click();
  }, [pdfUrl, paperTitle]);

  // Copy content
  const handleCopyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard');
    } catch {
      throttledToast.error('Failed to copy content');
    }
  }, [content]);

  // Monaco editor mount
  const handleEditorMount = useCallback(
    (editor: MonacoEditor.editor.IStandaloneCodeEditor, _monaco: Monaco) => {
      editorRef.current = editor;
      editor.addCommand(_monaco.KeyMod.CtrlCmd | _monaco.KeyCode.KeyS, () => {
        if (!(combine.isSave ?? true)) handleSave();
        else if (isEditMode) handleUpdate();
      });
    },
    [combine.isSave, isEditMode, handleSave, handleUpdate],
  );

  return (
    <div className="latex-paper-editor-shell bg-editor-bg fixed inset-0 z-50 flex">
      <style>{`
        .latex-paper-editor-shell .monaco-editor .margin-view-overlays .line-numbers,
        .latex-paper-editor-shell .monaco-editor .line-numbers {
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace !important;
          font-size: 14px !important;
        }

        .latex-paper-editor-shell .monaco-editor .current-line,
        .latex-paper-editor-shell .monaco-editor .current-line-margin {
          background: transparent !important;
          border: 0 !important;
        }

        .latex-paper-editor-shell .monaco-editor .cursors-layer .cursor {
          background-color: #2f6b5b !important;
          border-color: #2f6b5b !important;
        }
      `}</style>
      {/* ── Content area: same bg as section editor ────────────── */}
      <div className="bg-editor-bg flex min-h-0 flex-1 flex-col overflow-hidden p-2 dark:bg-[#1a1a1a]">
        {/* Single outer card wrapping left sidebar + editor + right panel */}
        <div className="bg-editor-content-bg flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#d0d0ce] shadow-sm dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
          {/* ── Left References Sidebar ────────────────────────── */}
          {isSidebarOpen && (
            <div className="bg-editor-bg flex w-72 shrink-0 flex-col overflow-hidden border-r border-[#e0e0de] dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-1">
                <div className="px-3 py-1">
                  <p className="mb-1 text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    References
                  </p>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <CombineReferencesPanel paperId={paperId} />
                </div>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="flex min-h-0 flex-1 overflow-hidden"
          >
            {/* ── Editor column ─────────────────────────────────── */}
            <div
              ref={editorColRef}
              className="bg-editor-content-bg flex shrink-0 flex-col overflow-hidden dark:bg-[#1e1e1e]"
              style={{ width: `${editorWidthPct}%` }}
            >
              {/* Editor top bar */}
              <div className="bg-editor-content-bg flex h-10 shrink-0 items-center border-b border-[#e0e0de] dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  title={isSidebarOpen ? 'Hide references' : 'Show references'}
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </button>

                <div className="flex min-w-0 items-center gap-2 px-3">
                  <span className="max-w-52 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {combine.name}
                  </span>
                </div>

                {/* SOURCE indicator */}
                <div className="ml-1 flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#2f6b5b]" />
                  <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    Combined
                  </span>
                </div>

                {isReadOnly && (
                  <div className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                    <Lock className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      Read-only
                    </span>
                  </div>
                )}

                <div className="flex-1" />

                {/* Close editor */}
                <button
                  type="button"
                  onClick={onClose}
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
                      ? 'bg-[#2f6b5b] text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Tools
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="latex-custom"
                  value={content}
                  onChange={(value) => {
                    if (!isReadOnly) setContent(value ?? '');
                  }}
                  onMount={handleEditorMount}
                  beforeMount={registerLatexLanguage}
                  theme="latex-light"
                  options={{
                    fontSize: 14,
                    lineHeight: 22,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: isReadOnly,
                    padding: { top: 16, bottom: 16 },
                    tabSize: 2,
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

              {/* Status bar at bottom of editor column */}
              <div className="bg-editor-content-bg flex h-9 shrink-0 items-center justify-between border-t border-[#e0e0de] px-3 dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Words: {stats.totalWords}</span>
                  <span>Headers: {stats.numHeaders}</span>
                  <span>Figures: {stats.numFigures}</span>
                  <span>
                    Math: {stats.numMathInlines + stats.numMathDisplayed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Saved / Unsaved indicator */}
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      hasChanges ? 'text-orange-500' : 'text-emerald-500',
                    )}
                  >
                    {hasChanges ? 'Unsaved changes' : 'Saved'}
                  </span>

                  {/* isSave=false: Save button (POST isPreview=false → return to detail) */}
                  {isAuthor && !(combine.isSave ?? true) && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg bg-[#630f0f] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f0c0c] disabled:opacity-50"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                    </button>
                  )}

                  {/* isSave=true, view mode: Edit button for author */}
                  {isAuthor && (combine.isSave ?? true) && !isEditMode && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-[#d0d0ce] px-4 py-1.5 text-sm font-semibold text-[#2f6b5b] hover:bg-[#f3efe6] dark:border-slate-700 dark:text-[#4eab8f] dark:hover:bg-slate-800"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}

                  {/* isSave=true, edit mode: Cancel + Update */}
                  {isAuthor && (combine.isSave ?? true) && isEditMode && (
                    <>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        onClick={() => {
                          setContent(savedContent);
                          setIsEditMode(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg bg-[#630f0f] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f0c0c] disabled:opacity-50"
                        onClick={handleUpdate}
                        disabled={updateMutation.isPending || !hasChanges}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {updateMutation.isPending ? 'Updating…' : 'Update'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right panel ──────────────────────────────────── */}
            <div className="bg-editor-bg relative m-2 flex flex-1 flex-col overflow-hidden rounded-xl dark:bg-[#111111]">
              {/* Drag handle on left edge */}
              <div
                className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize rounded-l-xl hover:bg-[#2f6b5b]/20 active:bg-[#2f6b5b]/30"
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

              {isToolsOpen ? (
                /* ── Tools panel (AI only) ── */
                <>
                  <div className="bg-editor-content-bg flex h-10 shrink-0 items-center gap-2 border-b border-[#e0e0de] px-3 dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
                    <MessageSquareText className="size-3.5 text-[#2f6b5b]" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      AI
                    </span>
                  </div>
                  <div className="bg-editor-content-bg flex flex-1 flex-col overflow-hidden dark:bg-[#1e1e1e]">
                    <EditorChatPanel
                      projectId={projectId}
                      sectionTitle={combine.name}
                      canWrite={isAuthor && !isReadOnly}
                    />
                  </div>
                </>
              ) : (
                /* ── PDF preview panel ── */
                <>
                  {/* PDF toolbar */}
                  <div
                    ref={pdfContainerRef}
                    className="bg-editor-content-bg flex h-10 shrink-0 items-center gap-1 border-b border-[#e0e0de] px-3 dark:border-[#2a2a2a] dark:bg-[#1e1e1e]"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="max-w-48 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {combine.name}
                      </span>
                    </div>
                    <div className="mx-1 h-4 w-px bg-[#d0d0ce] dark:bg-[#3a3a3a]" />

                    {/* Compile button */}
                    <button
                      type="button"
                      onClick={handleCompile}
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
                            setPdfZoom((z) => Math.max(50, z - 10))
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#333]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-10 text-center text-[10px] text-slate-500 tabular-nums">
                          {pdfZoom}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPdfZoom((z) => Math.min(200, z + 10))
                          }
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#333]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <div className="h-4 w-px bg-[#d0d0ce] dark:bg-[#3a3a3a]" />
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#333]"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyContent}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-[#333]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* PDF content area */}
                  <div className="flex-1 overflow-auto">
                    {isCompiling ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="size-8 animate-spin text-[#2f6b5b]" />
                          <span className="text-sm text-slate-500">
                            Compiling…
                          </span>
                        </div>
                      </div>
                    ) : compileError ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            Compilation Error
                          </p>
                          <p className="mt-1 text-xs text-red-500">
                            {compileError}
                          </p>
                        </div>
                      </div>
                    ) : pdfUrl ? (
                      <div className="flex justify-center p-4">
                        <Document
                          file={pdfUrl}
                          onLoadSuccess={({ numPages }) =>
                            setPdfNumPages(numPages)
                          }
                          loading={
                            <div className="flex items-center justify-center py-20">
                              <Loader2 className="size-6 animate-spin text-slate-400" />
                            </div>
                          }
                        >
                          <Page
                            pageNumber={pdfPageNum}
                            width={
                              pdfContainerWidth > 0
                                ? (pdfContainerWidth - 32) * (pdfZoom / 100)
                                : undefined
                            }
                            renderTextLayer
                            renderAnnotationLayer
                          />
                        </Document>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <Eye className="size-10 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm text-slate-500">
                            Click &ldquo;Compile&rdquo; to preview PDF
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
