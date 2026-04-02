import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
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
import { useProjectPapers } from '@/features/project-management/api/papers/get-project-papers';
import { useUser } from '@/lib/auth';

import { EditorChatPanel } from './editor-chat-panel';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ── LaTeX stats helper ────────────────────────────────────────────────────────
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
  let numHeaders = 0,
    wordsInHeaders = 0;
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(latexContent)) !== null) {
    numHeaders++;
    wordsInHeaders += m[1].trim().split(/\s+/).filter(Boolean).length;
  }

  const numFigures = (latexContent.match(/\\begin\s*\{figure\*?\}/g) || [])
    .length;

  const numDisplayedEnvs = (
    latexContent.match(
      /\\begin\s*\{(?:equation|align|gather|multline|eqnarray|displaymath)\*?\}/g,
    ) || []
  ).length;
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

// ── Sidebar contributor versions panel ───────────────────────────────────────
type MarkSectionItem = {
  sectionId: string;
  name: string;
  email: string;
  memberId: string;
  sectionRole: string;
  isMainSection: boolean;
  content: string;
};

const ContributorFullView = ({
  item,
  onBack,
}: {
  item: MarkSectionItem;
  onBack: () => void;
}) => (
  <div className="flex h-full flex-col overflow-hidden">
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <Button
        size="sm"
        variant="ghost"
        onClick={onBack}
        className="h-7 gap-1.5 px-2 text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Button>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
          {item.isMainSection ? 'Origin section' : item.name || item.email}
        </span>
        {item.isMainSection && (
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            origin
          </span>
        )}
      </div>
    </div>
    <div className="flex-1 overflow-hidden">
      <Editor
        defaultLanguage="latex"
        value={item.content || ''}
        theme="vs-dark"
        options={{
          readOnly: true,
          fontSize: 13,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          renderLineHighlight: 'none',
          scrollbar: { verticalScrollbarSize: 6 },
          padding: { top: 12 },
        }}
      />
    </div>
  </div>
);

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
  // Always keep main section; hide own non-main versions (including the one being edited)
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
        Loading contributors…
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
        const isMe =
          (item.email || '').toLowerCase() === currentUserEmail.toLowerCase();
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

// ── Versions tab panel (Old Versions + Other Versions switcher) ─────────────────
const openVersionInNewTab = (item: MarkSectionItem) => {
  const title = item.isMainSection ? 'Origin section' : item.name || item.email;
  const escaped = (item.content || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — LaTeX Source</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1e1e1e; color: #d4d4d4; font-family: 'Consolas', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; }
    header { background: #252526; border-bottom: 1px solid #333; padding: 10px 20px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
    header h1 { font-size: 14px; font-weight: 600; color: #ccc; }
    header span { font-size: 11px; background: #3a3a3a; border-radius: 4px; padding: 2px 8px; color: #888; }
    .code-wrap { padding: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0; vertical-align: top; }
    td.ln { padding: 0 16px; text-align: right; color: #555; user-select: none; min-width: 48px; border-right: 1px solid #333; }
    td.code { padding: 0 20px; white-space: pre; }
    tr:hover td { background: #2a2d2e; }
    .kw  { color: #4ec9b0; }
    .arg { color: #ce9178; }
    .opt { color: #b5cea8; }
    .cmt { color: #6a9955; font-style: italic; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <span>LaTeX source — read only</span>
  </header>
  <div class="code-wrap">
    <table><tbody>
${(item.content || '')
  .split('\n')
  .map((line, i) => {
    const esc = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlighted = esc
      .replace(/(\\[a-zA-Z@]+)/g, '<span class="kw">$1</span>')
      .replace(/\{([^}]*)\}/g, '{<span class="arg">$1</span>}')
      .replace(/\[([^\]]*)\]/g, '[<span class="opt">$1</span>]')
      .replace(/(%.*)$/, '<span class="cmt">$1</span>');
    return `      <tr><td class="ln">${i + 1}</td><td class="code">${highlighted}</td></tr>`;
  })
  .join('\n')}
    </tbody></table>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  // revoke after tab opens
  if (win) setTimeout(() => URL.revokeObjectURL(url), 10000);
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

// ── References tab panel (project papers) ─────────────────────────────────────
const ReferencesTab = ({
  projectId,
  compact = false,
}: {
  projectId?: string;
  compact?: boolean;
}) => {
  const query = useProjectPapers({
    projectId: projectId || '',
    queryConfig: { enabled: !!projectId },
  });
  const papers = ((query.data as any)?.result?.items ?? []) as Array<{
    id: string;
    title: string | null;
    abstract: string | null;
    doi: string | null;
    filePath: string | null;
    journalName: string | null;
    conferenceName: string | null;
    publicationDate: string | null;
    tagNames: string[];
  }>;

  if (!projectId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-slate-400">
        No project context to load references.
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

  if (papers.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <BookMarked className="h-7 w-7 text-slate-300 dark:text-slate-600" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No reference papers linked to this project yet.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'flex flex-1 flex-col overflow-y-auto p-4'}>
      {!compact && (
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
          References
          <span className="ml-1 font-normal text-slate-400 normal-case">
            ({papers.length})
          </span>
        </h3>
      )}
      <ol className={compact ? 'space-y-1' : 'space-y-2'}>
        {papers.map((paper, i) => (
          <li
            key={paper.id}
            className={
              compact
                ? 'flex items-start gap-1.5 rounded-md px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800'
                : 'flex gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900'
            }
          >
            <span className="shrink-0 text-[10px] font-bold text-slate-400">
              [{i + 1}]
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`leading-snug font-medium text-slate-800 dark:text-slate-200 ${compact ? 'text-[11px]' : 'text-xs'}`}
              >
                {paper.title || '(Untitled)'}
              </p>
              {!compact && (paper.journalName || paper.conferenceName) && (
                <p className="mt-0.5 text-[10px] text-slate-500 italic">
                  {paper.journalName || paper.conferenceName}
                </p>
              )}
              {!compact && paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 hover:underline dark:text-blue-400"
                >
                  <Link2 className="h-2.5 w-2.5" />
                  {paper.doi}
                </a>
              )}
              {!compact && paper.publicationDate && (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {new Date(paper.publicationDate).getFullYear()}
                </p>
              )}
            </div>
            {paper.filePath && (
              <a
                href={paper.filePath}
                target="_blank"
                rel="noopener noreferrer"
                title="Download paper"
                className={
                  compact
                    ? 'ml-auto flex shrink-0 items-center self-start rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                    : 'ml-auto flex shrink-0 items-center self-start rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                }
              >
                <Download className="h-3 w-3" />
              </a>
            )}
          </li>
        ))}
      </ol>
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
  // Only register once
  if (
    monaco.languages
      .getLanguages()
      .some((l: { id: string }) => l.id === 'latex-custom')
  )
    return;

  monaco.languages.register({ id: 'latex-custom' });

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

  // Custom light theme
  monaco.editor.defineTheme('latex-light', {
    base: 'vs',
    inherit: true,
    rules: [
      // LaTeX commands (\documentclass, \usepackage …) → dark navy blue
      { token: 'keyword', foreground: '2f6b5b', fontStyle: '' },
      // Math content → purple
      { token: 'string.math', foreground: '8250df' },
      // Math delimiters ($, $$) → purple bold
      { token: 'delimiter.math', foreground: '8250df', fontStyle: 'bold' },
      // Environment names → teal/dark-cyan
      { token: 'type.identifier', foreground: '0969da', fontStyle: 'italic' },
      // Curly brace content → orange/brown
      { token: 'delimiter.curly', foreground: 'bc4c00' },
      // Square bracket content → dark green
      { token: 'delimiter.square', foreground: '116329' },
      // Comments → slate italic
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      // Numbers → amber
      { token: 'number', foreground: 'b45309' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1f2328',
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
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const cursorPositionRef = useRef<CursorPosition | null>(null);
  const previousActiveSectionIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastReadOnlyToastRef = useRef<number>(0);

  useEffect(() => {
    setEditorSections(sections);
  }, [sections]);

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
          setContent(activeSection.content || '');
          setSavedContent(activeSection.content || '');
          if (activeSection.content) {
            compileAndRender(activeSection.content);
          } else {
            setPdfUrl(null);
            setCompileError(null);
          }
          previousActiveSectionIdRef.current = activeSectionId;
        }
      }
    }
  }, [editorSections, activeSectionId, compileAndRender]);

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
  ]);

  const handleClose = useCallback(() => {
    if (!isActiveSectionReadOnly && content !== savedContent) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [content, savedContent, onClose, isActiveSectionReadOnly]);

  const [kbdPos, setKbdPos] = useState({ x: 24, y: -1 });
  const kbdDragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const handleKbdPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      kbdDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: kbdPos.x,
        startPosY: kbdPos.y,
      };
    },
    [kbdPos],
  );

  const handleKbdPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!kbdDragRef.current) return;
      const dx = e.clientX - kbdDragRef.current.startX;
      const dy = e.clientY - kbdDragRef.current.startY;
      const newX = Math.max(0, kbdDragRef.current.startPosX + dx);
      const newY = kbdDragRef.current.startPosY + dy;
      setKbdPos({ x: newX, y: newY });
    },
    [],
  );

  const handleKbdPointerUp = useCallback(() => {
    kbdDragRef.current = null;
  }, []);

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
        <div className="flex w-48 shrink-0 flex-col bg-[#f1f1f1] dark:bg-[#1e1e1e]">
          {/* Sidebar header */}
          <div className="flex shrink-0 items-center border-b border-[#e5e5e5] px-3 py-2 dark:border-[#2a2a2a]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {isSidebarRefOpen ? (
                  <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
                ) : (
                  <ChevronRight className="h-3 w-3 transition-transform" />
                )}
                References
              </button>
              {isSidebarRefOpen && (
                <div className="max-h-64 overflow-y-auto px-2 pb-2">
                  <ReferencesTab projectId={projectId} compact />
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
                            const edits: MonacoEditor.IIdentifiedSingleEditOperation[] =
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
                          <span className="max-w-[12rem] truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                        <span className="min-w-[3.5rem] text-center text-xs text-slate-600 tabular-nums dark:text-slate-400">
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
                        <span className="min-w-[2.5rem] text-center text-[10px] text-slate-500 dark:text-slate-400">
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
      {!isActiveSectionReadOnly && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed z-50 h-9 w-9 cursor-grab rounded-full border-slate-300 bg-white shadow-lg hover:bg-slate-50 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-800"
              style={{
                left: kbdPos.x,
                ...(kbdPos.y < 0 ? { bottom: 24 } : { top: kbdPos.y }),
              }}
              title="Keyboard Shortcuts"
              onPointerDown={handleKbdPointerDown}
              onPointerMove={handleKbdPointerMove}
              onPointerUp={handleKbdPointerUp}
            >
              <Keyboard className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 p-0">
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
                <div key={label} className="flex items-center justify-between">
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
