import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronRight, Eye, Layers, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/cn';

import { LatexPaperEditor } from '@/features/project-management/components/papers/latex-paper-editor';

import { useGetPaperSections } from '../api/get-paper-sections';
import { PaperSection } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stripLatex = (input: string): string =>
  input
    .replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+\*?/g, '')
    .replace(/[{}]/g, '')
    .trim();

type SectionNode = PaperSection & { children: SectionNode[] };

const buildTree = (sections: PaperSection[]): SectionNode[] => {
  const map = new Map<string, SectionNode>();
  sections.forEach((s) => map.set(s.id, { ...s, children: [] }));

  const roots: SectionNode[] = [];
  map.forEach((node) => {
    if (node.parentSectionId && map.has(node.parentSectionId)) {
      map.get(node.parentSectionId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sort = (arr: SectionNode[]) => {
    arr.sort((a, b) => a.displayOrder - b.displayOrder);
    arr.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
};

type FlatRow = { node: SectionNode; depth: number; label: string };

const flattenTree = (
  nodes: SectionNode[],
  depth = 0,
  parentLabel = '',
): FlatRow[] => {
  let counter = 0;
  return nodes.flatMap((n) => {
    if (n.numbered) counter += 1;
    const label = n.numbered
      ? parentLabel
        ? `${parentLabel}.${counter}`
        : `${counter}`
      : '';
    return [
      { node: n, depth, label },
      ...flattenTree(n.children, depth + 1, label),
    ];
  });
};

// ─── Component ───────────────────────────────────────────────────────────────

type PaperSectionsReadOnlyDialogProps = {
  paperId: string;
  paperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PaperSectionsReadOnlyDialog = ({
  paperId,
  paperTitle,
  open,
  onOpenChange,
}: PaperSectionsReadOnlyDialogProps) => {
  const [viewSectionId, setViewSectionId] = useState<string | null>(null);

  const sectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: { enabled: open && !!paperId },
  });

  const rawSections: PaperSection[] = sectionsQuery.data?.result?.items ?? [];
  const tree = buildTree(rawSections);
  const rows = flattenTree(tree);

  return (
    <>
      {!viewSectionId && (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex h-[90vh] w-[90vw] max-w-4xl -translate-x-[50%] -translate-y-[50%] flex-col overflow-hidden rounded-xl shadow-2xl">
              {/* Close button */}
              <Dialog.Close className="text-muted-foreground hover:text-foreground absolute top-4 right-4 z-10 rounded-full p-1 transition-colors">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Dialog.Close>

              {/* Header */}
              <div className="border-border bg-muted/30 border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Layers className="text-primary h-5 w-5" />
                  </div>
                  <Dialog.Title className="text-foreground text-lg font-semibold">
                    Sections
                  </Dialog.Title>
                </div>
                {!sectionsQuery.isLoading && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    {rows.length} section{rows.length !== 1 ? 's' : ''} in this
                    paper
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto">
                {sectionsQuery.isLoading ? (
                  <div className="space-y-2 p-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : rows.length === 0 ? (
                  <div className="py-16 text-center">
                    <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p className="text-muted-foreground text-sm font-medium">
                      No sections found for this paper.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                          <TableHead className="w-8 text-center font-semibold text-green-900 dark:text-green-200">
                            #
                          </TableHead>
                          <TableHead className="font-semibold text-green-900 dark:text-green-200">
                            Section Title
                          </TableHead>
                          <TableHead className="w-20 text-right font-semibold text-green-900 dark:text-green-200">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(({ node, depth, label }, idx) => {
                          const isParent = depth === 0;
                          return (
                            <TableRow
                              key={node.id}
                              className={cn(
                                'transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20',
                                idx % 2 === 0
                                  ? 'bg-white dark:bg-transparent'
                                  : 'bg-slate-50/50 dark:bg-slate-900/20',
                              )}
                            >
                              <TableCell className="text-muted-foreground text-center text-xs">
                                {node.numbered ? label : '—'}
                              </TableCell>
                              <TableCell>
                                <div
                                  className="flex items-center gap-2"
                                  style={{ paddingLeft: `${depth * 20}px` }}
                                >
                                  {depth === 0 && (
                                    <Layers className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                  )}
                                  <span
                                    className={cn(
                                      'leading-snug',
                                      isParent
                                        ? 'text-foreground text-sm font-semibold'
                                        : 'text-foreground text-xs font-medium',
                                    )}
                                  >
                                    {stripLatex(node.title)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <button
                                  type="button"
                                  onClick={() => setViewSectionId(node.id)}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {viewSectionId && (
        <LatexPaperEditor
          paperTitle={paperTitle}
          sections={rows.map(({ node }) => ({
            id: node.id,
            title: stripLatex(node.title),
            content: node.content || '',
            memberId: '',
            numbered: node.numbered,
            sectionSumary: node.sectionSumary || '',
            parentSectionId: node.parentSectionId ?? null,
          }))}
          initialSectionId={viewSectionId}
          readOnly
          onClose={() => setViewSectionId(null)}
        />
      )}
    </>
  );
};
