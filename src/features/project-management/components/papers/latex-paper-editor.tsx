import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import {
  X,
  FileText,
  Save,
  Play,
  PanelLeftOpen,
  PanelLeftClose,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BTN } from '@/lib/button-styles';

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
      // LaTeX commands → green
      { token: 'keyword', foreground: '16a34a', fontStyle: 'bold' },
      // Math content → purple
      { token: 'string.math', foreground: '7c3aed' },
      // Math delimiters ($, $$) → purple bold
      { token: 'delimiter.math', foreground: '9333ea', fontStyle: 'bold' },
      // Environment names → blue
      { token: 'type.identifier', foreground: '2563eb', fontStyle: 'italic' },
      // Curly braces → orange
      { token: 'delimiter.curly', foreground: 'ea580c' },
      // Square brackets → teal
      { token: 'delimiter.square', foreground: '0d9488' },
      // Comments → grey italic
      { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
      // Numbers → amber
      { token: 'number', foreground: 'd97706' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1e293b',
      'editor.lineHighlightBackground': '#f8fafc',
      'editor.selectionBackground': '#dbeafe',
      'editor.inactiveSelectionBackground': '#e2e8f0',
      'editorLineNumber.foreground': '#cbd5e1',
      'editorLineNumber.activeForeground': '#64748b',
      'editorCursor.foreground': '#2563eb',
      'editorIndentGuide.background': '#f1f5f9',
      'editorIndentGuide.activeBackground': '#e2e8f0',
      'editorBracketMatch.background': '#dbeafe',
      'editorBracketMatch.border': '#93c5fd',
    },
  });
};

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{Sample Paper}
\\author{Author Name}

\\begin{document}

\\maketitle

\\section{Introduction}

This is a sample LaTeX document. You can write mathematical expressions inline like $E = mc^2$ or in display mode:

$$\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}$$

\\section{Equations}

The quadratic formula is given by:

\\begin{equation}
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\end{equation}

Maxwell's equations in differential form:

\\begin{align}
\\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
\\nabla \\cdot \\mathbf{B} &= 0 \\\\
\\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
\\nabla \\times \\mathbf{B} &= \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{align}

\\section{Matrices}

A matrix example:

$$
A = \\begin{pmatrix}
a_{11} & a_{12} & a_{13} \\\\
a_{21} & a_{22} & a_{23} \\\\
a_{31} & a_{32} & a_{33}
\\end{pmatrix}
$$

\\end{document}
`;

const MATHJAX_CONFIG = {
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    processEscapes: true,
    processEnvironments: true,
    tags: 'ams',
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
  },
};

/**
 * Isolated MathJax preview component wrapped in React.memo.
 * It will ONLY re-render when the html prop changes (on timer or Render click),
 * completely preventing flashing while typing in the editor.
 */
const PreviewPanel = React.memo(function PreviewPanel({
  html,
}: {
  html: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-white px-10 py-8 dark:bg-slate-950">
      <MathJaxContext config={MATHJAX_CONFIG}>
        <MathJax
          dynamic
          hideUntilTypeset="first"
          style={{
            fontFamily:
              "'Computer Modern', 'Latin Modern', 'Times New Roman', serif",
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#1e293b',
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </MathJax>
      </MathJaxContext>
    </div>
  );
});

type LatexPaperEditorProps = {
  paperTitle: string;
  initialContent?: string;
  onClose: () => void;
  onSave?: (content: string) => void;
};

export const LatexPaperEditor = ({
  paperTitle,
  initialContent,
  onClose,
  onSave,
}: LatexPaperEditorProps) => {
  const [content, setContent] = useState(initialContent || DEFAULT_LATEX);
  const [preview, setPreview] = useState(initialContent || DEFAULT_LATEX);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Manual render
  const handleRender = useCallback(() => {
    setPreview(content);
  }, [content]);

  // Auto-render every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPreview((prev) => {
        // Only update if content actually changed
        if (prev !== content) return content;
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [content]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll while editor is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setContent(value ?? '');
  }, []);

  const handleSave = () => {
    onSave?.(content);
  };

  /**
   * Convert raw LaTeX source to a simplified HTML-ish string
   * that MathJax can render. We keep math delimiters intact and
   * translate common LaTeX structural commands to HTML equivalents.
   */
  const latexToPreviewHtml = (src: string): string => {
    let text = src;

    // Strip preamble commands that have no visual meaning
    text = text.replace(/\\documentclass\{[^}]*\}/g, '');
    text = text.replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, '');
    text = text.replace(/\\begin\{document\}/g, '');
    text = text.replace(/\\end\{document\}/g, '');

    // Title / author / date
    const titleMatch = text.match(/\\title\{([^}]*)\}/);
    const authorMatch = text.match(/\\author\{([^}]*)\}/);
    text = text.replace(/\\title\{[^}]*\}/g, '');
    text = text.replace(/\\author\{[^}]*\}/g, '');
    text = text.replace(/\\date\{[^}]*\}/g, '');
    text = text.replace(/\\maketitle/g, '');

    let header = '';
    if (titleMatch) {
      header += `<h1 style="text-align:center;margin-bottom:4px;font-size:1.8em;color:#1e293b">${titleMatch[1]}</h1>`;
    }
    if (authorMatch) {
      header += `<p style="text-align:center;color:#64748b;margin-top:0;font-style:italic">${authorMatch[1]}</p>`;
    }
    if (header)
      header +=
        '<hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0"/>';

    // Regex source to match content with up to 1 level of nested curly braces
    const arg = '((?:[^{}]*|\\{[^{}]*\\})*)';

    // Sections
    text = text.replace(
      new RegExp(`\\\\section\\{${arg}\\}`, 'g'),
      '<h2 style="margin-top:28px;margin-bottom:10px;color:#1e293b;font-size:1.4em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">$1</h2>',
    );
    text = text.replace(
      new RegExp(`\\\\subsection\\{${arg}\\}`, 'g'),
      '<h3 style="margin-top:20px;margin-bottom:8px;color:#334155;font-size:1.15em">$1</h3>',
    );
    text = text.replace(
      new RegExp(`\\\\subsubsection\\{${arg}\\}`, 'g'),
      '<h4 style="margin-top:14px;margin-bottom:6px;color:#475569">$1</h4>',
    );

    // Bold / italic
    text = text.replace(
      new RegExp(`\\\\textbf\\{${arg}\\}`, 'g'),
      '<strong>$1</strong>',
    );
    text = text.replace(
      new RegExp(`\\\\textit\\{${arg}\\}`, 'g'),
      '<em>$1</em>',
    );
    text = text.replace(new RegExp(`\\\\emph\\{${arg}\\}`, 'g'), '<em>$1</em>');

    // Lists (itemize, enumerate)
    text = text.replace(
      /\\begin\{itemize\}/g,
      '<ul style="list-style-type:disc; padding-left:24px; margin:16px 0;">',
    );
    text = text.replace(/\\end\{itemize\}/g, '</ul>');

    text = text.replace(
      /\\begin\{enumerate\}/g,
      '<ol style="list-style-type:decimal; padding-left:24px; margin:16px 0;">',
    );
    text = text.replace(/\\end\{enumerate\}/g, '</ol>');

    text = text.replace(/\\item/g, '<li style="margin-bottom:8px;">');

    // Convert line-breaks: double newlines → <p> breaks
    // (Skip doing it if it's right between list tags)
    text = text.replace(/\n{2,}/g, '</p><p>');

    return `<div>${header}<p>${text}</p></div>`;
  };

  // Memoize preview HTML so MathJax won't re-process on parent re-renders
  const previewHtml = useMemo(() => latexToPreviewHtml(preview), [preview]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
      {/* ── Top Header Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
            <FileText className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-foreground text-sm leading-tight font-semibold">
              LaTeX Editor
            </h2>
            <p className="max-w-xs truncate text-xs text-slate-400">
              {paperTitle}
            </p>
          </div>
        </div>

        {/* Right: Save + Close */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className={`flex items-center gap-1.5 ${BTN.SUCCESS}`}
          >
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-1.5 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
        </div>
      </div>

      {/* ── Main Layout (Sidebar + Content) ─────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* File Sidebar */}
        <div
          className={`relative bg-white dark:bg-slate-900 ${
            isSidebarOpen
              ? 'w-72 border-r border-slate-200 dark:border-slate-800'
              : 'hidden'
          }`}
        >
          <div className="absolute inset-0 flex w-72 flex-col gap-4 p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Project Files
            </h3>
            <Button
              variant="outline"
              className="flex w-full items-center justify-center gap-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              Upload Image/File
            </Button>

            {/* Empty state for now */}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <ImageIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                No files uploaded yet. <br />
                Upload images here to reference them in your document.
              </p>
            </div>
          </div>
        </div>

        {/* ── Editor + Preview ────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
          {/* Monaco Editor — left half */}
          <div className="flex w-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {/* Panel label */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
                SOURCE — LaTeX
              </span>
            </div>
            {/* Editor container with rounded bottom */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="latex-custom"
                value={content}
                onChange={handleEditorChange}
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
                }}
              />
            </div>
          </div>

          {/* MathJax Preview — right half */}
          <div className="flex w-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {/* Panel label + Render button */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
                  PREVIEW
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleRender}
                className="flex h-7 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-medium text-white shadow-sm hover:bg-emerald-600"
              >
                <Play className="h-3 w-3" />
                Render
              </Button>
            </div>
            {/* Preview content */}
            <PreviewPanel html={previewHtml} />
          </div>
        </div>
      </div>
    </div>
  );
};
