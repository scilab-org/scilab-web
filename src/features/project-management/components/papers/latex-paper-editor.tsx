import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import {
  X,
  FileText,
  Save,
  Play,
  PanelLeftOpen,
  PanelLeftClose,
  Upload,
  Image as ImageIcon,
  Loader2,
  Keyboard,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { useGetSectionFiles } from '@/features/paper-management/api/get-section-files';
import { useUploadSectionFile } from '@/features/paper-management/api/upload-section-file';

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

/**
 * PDF preview panel that displays the compiled LaTeX output.
 */
const PreviewPanel = React.memo(function PreviewPanel({
  pdfUrl,
  isCompiling,
  error,
}: {
  pdfUrl: string | null;
  isCompiling: boolean;
  error: string | null;
}) {
  if (isCompiling) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Compiling LaTeX…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-10 dark:bg-slate-950">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <p className="font-medium">Compilation Error</p>
          <pre className="mt-2 max-h-60 overflow-auto text-xs whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white dark:bg-slate-950">
        <Play className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        <span className="text-sm text-slate-400 dark:text-slate-500">
          Click <strong>Render</strong> to compile and preview PDF
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-white dark:bg-slate-950">
      <object
        data={`${pdfUrl}#toolbar=1&navpanes=0`}
        type="application/pdf"
        title="PDF Preview"
        className="h-full w-full"
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
          <p className="text-sm text-slate-500">Cannot display PDF inline.</p>
          <a
            href={pdfUrl}
            download="preview.pdf"
            className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
          >
            Download PDF
          </a>
        </div>
      </object>
    </div>
  );
});

type SectionProp = {
  id: string;
  title: string;
  content: string;
  memberId: string;
  numbered: boolean;
  sectionSumary: string;
  parentSectionId: string | null;
  sectionRole?: string;
};

type LatexPaperEditorProps = {
  paperTitle: string;
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
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'files'>(
    sections?.length ? 'sections' : 'files',
  );
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialSectionId || (sections?.[0]?.id ?? null),
  );
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [savedContent, setSavedContent] = useState(initialContent ?? '');
  const [copiedFileUrl, setCopiedFileUrl] = useState<string | null>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const cursorPositionRef = useRef<CursorPosition | null>(null);
  const previousActiveSectionIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeSection =
    sections?.find((section) => section.id === activeSectionId) ?? null;
  const hasEditPermissionForActiveSection =
    !activeSection?.sectionRole ||
    editableSectionRoles.has(activeSection.sectionRole);
  const isActiveSectionReadOnly =
    readOnly || !hasEditPermissionForActiveSection;

  const sectionFilesQuery = useGetSectionFiles({
    sectionId: activeSectionId,
    enabled: !!activeSectionId && !isActiveSectionReadOnly,
  });
  const sectionFiles = isActiveSectionReadOnly
    ? []
    : (sectionFilesQuery.data ?? []);

  const uploadSectionFileMutation = useUploadSectionFile({
    mutationConfig: {
      onSuccess: (fileId) => {
        toast.success(
          fileId
            ? `File uploaded successfully (id: ${fileId})`
            : 'File uploaded successfully',
        );
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
    if (isActiveSectionReadOnly) {
      return;
    }
    compileAndRender(content);
  }, [content, compileAndRender, isActiveSectionReadOnly]);

  // Clean up PDF blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  // When sections or activeSectionId changes, load content into editor
  useEffect(() => {
    if (sections && activeSectionId) {
      const activeSection = sections.find((s) => s.id === activeSectionId);
      if (activeSection) {
        const isSectionSwitched =
          previousActiveSectionIdRef.current !== activeSectionId;

        setContent(activeSection.content || '');
        setSavedContent(activeSection.content || '');

        // Keep preview while saving current section; re-render preview when switching section.
        if (isSectionSwitched) {
          if (activeSection.content) {
            compileAndRender(activeSection.content);
          } else {
            setPdfUrl(null);
            setCompileError(null);
          }
        }

        previousActiveSectionIdRef.current = activeSectionId;
      }
    }
  }, [sections, activeSectionId, compileAndRender]);

  useEffect(() => {
    if (!sections?.length && sidebarTab !== 'files') {
      setSidebarTab('files');
    }
  }, [sections, sidebarTab]);

  // Auto-render on first mount with the initial section content
  const hasRenderedOnce = useRef(false);
  useEffect(() => {
    if (!hasRenderedOnce.current) {
      hasRenderedOnce.current = true;

      // When section outline is present, preview rendering is handled by section-switch effect.
      if (sections?.length) return;

      const initialLatex = content;

      if (initialLatex) {
        compileAndRender(initialLatex);
      }
    }
  }, [content, sections, compileAndRender]);

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

  const handleSave = useCallback(() => {
    if (isActiveSectionReadOnly) {
      toast.error('You do not have permission to edit this section.');
      return;
    }
    if (!activeSectionId || !sections) {
      toast.error('No section selected to save.');
      return;
    }
    const activeSection = sections.find((s) => s.id === activeSectionId);
    if (!activeSection) {
      toast.error('Section not found.');
      return;
    }
    updateSectionMutation.mutate({
      sectionId: activeSectionId,
      data: {
        sectionId: activeSectionId,
        memberId: activeSection.memberId,
        title: activeSection.title,
        content: content,
        numbered: activeSection.numbered,
        sectionSumary: activeSection.sectionSumary || '',
        parentSectionId: activeSection.parentSectionId,
      },
    });
    setSavedContent(content);
    onSave?.(content, activeSectionId);
  }, [
    activeSectionId,
    sections,
    content,
    updateSectionMutation,
    onSave,
    isActiveSectionReadOnly,
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
            <h2 className="text-foreground text-lg leading-tight font-semibold">
              {activeSectionId && sections
                ? sections.find((s) => s.id === activeSectionId)?.title ||
                  paperTitle
                : paperTitle}
            </h2>
          </div>
        </div>

        {/* Right: Save + Close */}
        <div className="flex items-center gap-2">
          {!isActiveSectionReadOnly && (
            <AlertDialog
              open={showSaveConfirm}
              onOpenChange={setShowSaveConfirm}
            >
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={updateSectionMutation.isPending}
                  className={`flex items-center gap-1.5 ${BTN.SUCCESS}`}
                >
                  {updateSectionMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {updateSectionMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Save</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to save the changes to this section?
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-1.5 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
        </div>
      </div>

      {/* Unsaved changes confirmation dialog */}
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
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => setSidebarTab('sections')}
                disabled={!sections?.length}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  sidebarTab === 'sections'
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                }`}
              >
                Sections
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('files')}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  sidebarTab === 'files'
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                }`}
              >
                Files
              </button>
            </div>

            {sidebarTab === 'sections' ? (
              <>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Paper Sections
                </h3>
                <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-1 py-1">
                  {sections?.length ? (
                    sections.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSectionId(sec.id)}
                        className={`truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          activeSectionId === sec.id
                            ? 'bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                        title={sec.title}
                      >
                        {sec.title || '(Untitled)'}
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                      No section outline available.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Uploaded Files
                </h3>
                {activeSectionId && sections?.length ? (
                  <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Section:{' '}
                    {sections.find((s) => s.id === activeSectionId)?.title ||
                      '(Untitled)'}
                  </p>
                ) : (
                  <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Select a section to upload files.
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                {!isActiveSectionReadOnly && (
                  <Button
                    variant="outline"
                    onClick={handleOpenFilePicker}
                    disabled={
                      !activeSectionId || uploadSectionFileMutation.isPending
                    }
                    className="flex w-full items-center justify-center gap-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {uploadSectionFileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadSectionFileMutation.isPending
                      ? 'Uploading...'
                      : 'Upload Image/File'}
                  </Button>
                )}

                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {isActiveSectionReadOnly ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <ImageIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        You only have read permission for this section. <br />
                        Files are hidden and upload is disabled.
                      </p>
                    </div>
                  ) : sectionFilesQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading files...
                    </div>
                  ) : sectionFiles.length > 0 ? (
                    sectionFiles.map((fileUrl) => (
                      <div
                        key={fileUrl}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-900/60"
                      >
                        {isImageFileUrl(fileUrl) && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={fileUrl}
                              alt={getFileNameFromUrl(fileUrl)}
                              className="h-36 w-full rounded-md border border-slate-200 object-cover dark:border-slate-700"
                            />
                          </a>
                        )}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`${isImageFileUrl(fileUrl) ? 'mt-2' : ''} flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400`}
                          title={fileUrl}
                        >
                          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {getFileNameFromUrl(fileUrl)}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <div className="mt-2 flex items-center gap-1.5">
                          {!isActiveSectionReadOnly && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleInsertFileUrl(fileUrl)}
                              className="h-7 px-2 text-xs"
                            >
                              Insert URL
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyFileUrl(fileUrl)}
                            className="h-7 px-2 text-xs"
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            {copiedFileUrl === fileUrl ? 'Copied' : 'Copy URL'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <ImageIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        No files uploaded yet. <br />
                        Upload images/files here to reference them in your
                        document.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Editor + Preview ────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
          {/* Monaco Editor — left half (hidden in readOnly mode) */}
          {!isActiveSectionReadOnly && (
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
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    cursorPositionRef.current = editor.getPosition();

                    editor.onDidChangeCursorPosition((event) => {
                      cursorPositionRef.current = event.position;
                    });

                    const wrapSelection = (prefix: string, suffix: string) => {
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

                    // Ctrl+B → \textbf{}
                    editor.addAction({
                      id: 'latex-bold',
                      label: 'LaTeX Bold',
                      keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
                      ],
                      run: () => wrapSelection('\\textbf{', '}'),
                    });

                    // Ctrl+I → \textit{}
                    editor.addAction({
                      id: 'latex-italic',
                      label: 'LaTeX Italic',
                      keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
                      ],
                      run: () => wrapSelection('\\textit{', '}'),
                    });

                    // Ctrl+U → \underline{}
                    editor.addAction({
                      id: 'latex-underline',
                      label: 'LaTeX Underline',
                      keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU,
                      ],
                      run: () => wrapSelection('\\underline{', '}'),
                    });

                    // Ctrl+Shift+M → inline math $...$
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

                    // Ctrl+Shift+E → display math $$...$$
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

                    // Ctrl+Shift+B → \begin{} ... \end{}
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
                        wrapSelection(`\\begin{${env}}\n`, `\n\\end{${env}}`);
                      },
                    });

                    // Ctrl+/ → Toggle comment (%)
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
                  }}
                />
              </div>
            </div>
          )}

          {/* PDF Preview — right half (full width in readOnly mode) */}
          <div
            className={`flex ${isActiveSectionReadOnly ? 'w-full' : 'w-1/2'} flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900`}
          >
            {/* Panel label + Render button */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
                  PREVIEW
                </span>
              </div>
              {!isActiveSectionReadOnly && (
                <Button
                  size="sm"
                  onClick={handleRender}
                  disabled={isCompiling}
                  className="flex h-7 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isCompiling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {isCompiling ? 'Compiling…' : 'Recompile'}
                </Button>
              )}
            </div>
            {/* Preview content */}
            <PreviewPanel
              pdfUrl={pdfUrl}
              isCompiling={isCompiling}
              error={compileError}
            />
          </div>
        </div>
      </div>

      {/* Floating Keyboard Shortcuts Button */}
      {!isActiveSectionReadOnly && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed right-6 bottom-6 z-50 h-10 w-10 rounded-full border-slate-300 bg-white shadow-lg hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-72 p-0">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Keyboard Shortcuts
              </h4>
            </div>
            <div className="space-y-1 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Save</span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Render Preview
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Bold</span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + B
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Italic
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + I
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Underline
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + U
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Inline Math
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + Shift + M
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Display Math
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + Shift + E
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Environment
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + Shift + B
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Toggle Comment
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Ctrl + /
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Close Editor
                </span>
                <kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Esc
                </kbd>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
