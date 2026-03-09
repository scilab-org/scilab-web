import * as React from 'react';
import { X, Loader2, Search, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { BTN } from '@/lib/button-styles';
import {
  PAPER_INITIALIZE_STATUS_OPTIONS,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { PROJECT_MANAGEMENT_QUERY_KEYS } from '@/features/project-management/constants';
import { usePaperTemplates } from '@/features/paper-template-management/api/get-paper-templates';
import { usePaperTemplate } from '@/features/paper-template-management/api/get-paper-template';
import { PaperTemplateDto } from '@/features/paper-template-management/types';
import { useInitializePaper } from '../api/initialize-paper';
import { InitializePaperDto, PaperSection } from '../types';

const generateGuid = () => {
  return crypto.randomUUID();
};

/** Convert a human-readable section title to its LaTeX command.
 *  Main sections  → \section{Title}
 *  Sub-sections   → \subsection{Title}
 */
const toLatex = (title: string, isSubSection = false): string => {
  const cmd = isSubSection ? 'subsection' : 'section';
  return `\\${cmd}{${title}}`;
};

type SectionRow = PaperSection & {
  _id: string;
  latex: string;
  allowSubsections?: boolean;
};

type CreatePaperInProjectProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialFormData = {
  title: '',
  abstract: '',
  doi: '',
  paperType: '',
  status: 1,
};

export const CreatePaperInProject = ({
  projectId: _projectId,
  open,
  onOpenChange,
}: CreatePaperInProjectProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState(initialFormData);

  // Template selector state
  const [templateCodeInput, setTemplateCodeInput] = React.useState('');
  const [templateSearch, setTemplateSearch] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<PaperTemplateDto | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = React.useState(false);

  // Sections editor state
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [newSectionTitle, setNewSectionTitle] = React.useState('');

  const mainSections = React.useMemo(
    () =>
      sections
        .filter((section) => !section.parentSectionId)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [sections],
  );

  const subSectionsByParent = React.useMemo(() => {
    const grouped = new Map<string, SectionRow[]>();
    sections
      .filter((section) => !!section.parentSectionId)
      .forEach((section) => {
        const parentId = section.parentSectionId!;
        const siblings = grouped.get(parentId) ?? [];
        siblings.push(section);
        grouped.set(parentId, siblings);
      });

    grouped.forEach((subSections, parentId) => {
      subSections.sort((a, b) => a.displayOrder - b.displayOrder);
      grouped.set(parentId, subSections);
    });

    return grouped;
  }, [sections]);

  // Debounce template search
  React.useEffect(() => {
    const timer = setTimeout(() => setTemplateSearch(templateCodeInput), 300);
    return () => clearTimeout(timer);
  }, [templateCodeInput]);

  // Fetch template list for dropdown
  const templatesQuery = usePaperTemplates({
    params: { Code: templateSearch || undefined, PageSize: 20 },
    queryConfig: { enabled: showTemplateDropdown },
  });
  const templateResults: PaperTemplateDto[] =
    (templatesQuery.data as any)?.result?.items ?? [];

  // Fetch template detail when one is selected
  const templateDetailQuery = usePaperTemplate({
    id: selectedTemplate?.id ?? '',
    queryConfig: { enabled: !!selectedTemplate?.id },
  });

  // Fill sections when detail loads
  React.useEffect(() => {
    const detail = (templateDetailQuery.data as any)?.result?.template as
      | PaperTemplateDto
      | undefined;
    if (!detail) return;
    const rawSections = detail.templateStructure?.sections ?? [];
    setSections(
      rawSections.map((s, i) => {
        const sectionId = generateGuid();
        return {
          _id: `tpl-${sectionId}`,
          id: sectionId,
          title: s.title,
          latex: s.latex ?? toLatex(s.title, false),
          content: '',
          numbered: s.numbered ?? true,
          displayOrder: s.displayOrder ?? s.order ?? i,
          sectionSumary: '',
          allowSubsections: s.allowSubsections,
        };
      }),
    );
  }, [templateDetailQuery.data]);

  // Mutation using initialize endpoint
  const initializeMutation = useInitializePaper({
    mutationConfig: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
        });
        queryClient.invalidateQueries({
          queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.SUB_PROJECTS, _projectId],
        });
        onOpenChange(false);
        resetForm();
        toast.success('Paper initialized successfully');
      },
      onError: () => {
        toast.error('Failed to initialize paper');
      },
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setTemplateCodeInput('');
    setTemplateSearch('');
    setSelectedTemplate(null);
    setShowTemplateDropdown(false);
    setSections([]);
    setNewSectionTitle('');
  };

  const handleSelectTemplate = (template: PaperTemplateDto) => {
    setSelectedTemplate(template);
    setTemplateCodeInput(template.code ?? '');
    setShowTemplateDropdown(false);
    setSections([]);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setTemplateCodeInput('');
    setTemplateSearch('');
    setSections([]);
  };

  const handleResetTemplateSearch = () => {
    setTemplateCodeInput('');
    setTemplateSearch('');
    setShowTemplateDropdown(false);
  };

  const handleSearchTemplate = () => {
    setTemplateSearch(templateCodeInput);
    setShowTemplateDropdown(true);
  };

  const handleAddSection = () => {
    const trimmed = newSectionTitle.trim();
    if (!trimmed) return;
    const maxOrder = Math.max(...sections.map((s) => s.displayOrder), -1);
    const sectionId = generateGuid();
    setSections((prev) => [
      ...prev,
      {
        _id: `custom-${sectionId}`,
        id: sectionId,
        title: trimmed,
        latex: toLatex(trimmed, false),
        content: '',
        numbered: true,
        displayOrder: maxOrder + 1,
        sectionSumary: '',
      },
    ]);
    setNewSectionTitle('');
  };

  const handleRemoveSection = (rowId: string, sectionId: string) => {
    // Remove the section and any sub-sections belonging to it
    setSections((prev) =>
      prev.filter((s) => s._id !== rowId && s.parentSectionId !== sectionId),
    );
  };

  const handleAddSubSection = (parentId: string) => {
    setSections((prev) => {
      // Find the parent section to get its actual ID
      const parentSection = prev.find(
        (s) => s._id === parentId || s.id === parentId,
      );
      if (!parentSection) return prev;

      const siblingSubSections = prev.filter(
        (s) => s.parentSectionId === parentSection.id,
      );
      const maxDisplayOrder = Math.max(
        ...siblingSubSections.map((s) => s.displayOrder),
        0,
      );
      const subSectionDisplayOrder = maxDisplayOrder + 1;
      const newSubSectionId = generateGuid();

      return [
        ...prev,
        {
          _id: `sub-${newSubSectionId}`,
          id: newSubSectionId,
          title: '',
          latex: toLatex('', true),
          content: '',
          numbered: true,
          displayOrder: subSectionDisplayOrder,
          sectionSumary: '',
          parentSectionId: parentSection.id,
        },
      ];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload: InitializePaperDto = {
      projectId: _projectId,
      title: formData.title,
      abstract: formData.abstract,
      doi: formData.doi,
      status: formData.status,
      paperType: formData.paperType,
      sections: sections.map((sec) => ({
        id: sec.id,
        title: sec.title || '',
        content: sec.latex || sec.content || '',
        numbered: sec.numbered,
        displayOrder: sec.displayOrder,
        sectionSumary: sec.sectionSumary || '',
        ...(sec.parentSectionId && { parentSectionId: sec.parentSectionId }),
      })),
    };

    initializeMutation.mutate(payload);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <SheetContent side="right" className="overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Initialize New Paper</SheetTitle>
          <SheetDescription>
            Select a template, fill in the details, and customize sections.
            Title is required.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-paper-in-project-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          {/* ── Title ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="cpp-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter paper title"
              required
            />
          </div>

          {/* ── Template selector ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-template-code" className="text-sm font-medium">
              Template
            </label>
            {selectedTemplate ? (
              <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{selectedTemplate.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Code: {selectedTemplate.code}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  onClick={handleClearTemplate}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      id="cpp-template-code"
                      placeholder="Search by template code..."
                      value={templateCodeInput}
                      onChange={(e) => {
                        setTemplateCodeInput(e.target.value);
                        setShowTemplateDropdown(true);
                      }}
                      onFocus={() => setShowTemplateDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchTemplate();
                        }
                      }}
                      className="pl-9"
                    />
                  </div>
                  {showTemplateDropdown && (
                    <div className="border-border bg-popover absolute z-50 mt-1 w-full rounded-lg border shadow-md">
                      {templatesQuery.isLoading ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm">
                          <Loader2 className="size-3.5 animate-spin" />
                          Loading templates...
                        </div>
                      ) : templateResults.length > 0 ? (
                        <ul className="max-h-48 overflow-y-auto py-1">
                          {templateResults.map((tpl) => (
                            <li key={tpl.id}>
                              <button
                                type="button"
                                className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                                onClick={() => handleSelectTemplate(tpl)}
                              >
                                <Check className="text-primary invisible size-3.5" />
                                <div className="min-w-0">
                                  <p className="font-medium">{tpl.name}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {tpl.code}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground px-3 py-2 text-sm">
                          {templateSearch
                            ? `No templates found for "${templateSearch}"`
                            : 'No templates available'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Search / Reset buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetTemplateSearch}
                    className={BTN.CANCEL}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={BTN.EDIT}
                    onClick={handleSearchTemplate}
                  >
                    <Search className="size-4" />
                    Search
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sections from template + custom ── */}
          {selectedTemplate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sections
                {sections.length > 0 && (
                  <span className="text-muted-foreground ml-1 font-normal">
                    ({sections.length})
                  </span>
                )}
              </label>

              {templateDetailQuery.isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading sections...
                </div>
              ) : sections.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border shadow-sm">
                  <Table className="table-fixed">
                    <colgroup>
                      <col className="w-10" />
                      <col />
                      <col className="w-20" />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                        <TableHead className="w-10 font-semibold text-green-900 dark:text-green-200">
                          #
                        </TableHead>
                        <TableHead className="font-semibold text-green-900 dark:text-green-200">
                          Section Title
                        </TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mainSections.map((mainSection, mainIndex) => {
                        const subSections =
                          subSectionsByParent.get(mainSection.id) ?? [];

                        return (
                          <React.Fragment key={mainSection._id}>
                            {/* Main section row */}
                            <TableRow>
                              <TableCell className="text-muted-foreground text-sm font-medium">
                                {mainIndex + 1}
                              </TableCell>
                              <TableCell className="align-top">
                                <Input
                                  value={mainSection.title}
                                  onChange={(e) =>
                                    setSections((prev) =>
                                      prev.map((section) =>
                                        section._id === mainSection._id
                                          ? {
                                              ...section,
                                              title: e.target.value,
                                              latex: toLatex(
                                                e.target.value,
                                                false,
                                              ),
                                            }
                                          : section,
                                      ),
                                    )
                                  }
                                  className="h-8 text-sm"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-0.5">
                                  {mainSection.allowSubsections !== false && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Add sub-section"
                                      className="size-6 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                                      onClick={() =>
                                        handleAddSubSection(mainSection.id)
                                      }
                                    >
                                      <Plus className="size-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                    onClick={() =>
                                      handleRemoveSection(
                                        mainSection._id,
                                        mainSection.id,
                                      )
                                    }
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Subsection rows – each gets its own full-width row */}
                            {subSections.map((subSection, subIndex) => (
                              <TableRow
                                key={subSection._id}
                                className="bg-muted/20 hover:bg-muted/30"
                              >
                                <TableCell className="text-muted-foreground text-xs">
                                  <div className="flex items-center gap-1 pl-3">
                                    <span className="bg-muted-foreground/30 h-3.5 w-px" />
                                    {`${mainIndex + 1}.${subIndex + 1}`}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="pl-3">
                                    <Input
                                      value={subSection.title}
                                      onChange={(e) =>
                                        setSections((prev) =>
                                          prev.map((section) =>
                                            section._id === subSection._id
                                              ? {
                                                  ...section,
                                                  title: e.target.value,
                                                  latex: toLatex(
                                                    e.target.value,
                                                    true,
                                                  ),
                                                }
                                              : section,
                                          ),
                                        )
                                      }
                                      className="h-8 text-sm"
                                      placeholder="Sub-section title..."
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-6 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                      onClick={() =>
                                        handleRemoveSection(
                                          subSection._id,
                                          subSection.id,
                                        )
                                      }
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {/* Add custom section row */}
              <div className="flex gap-2">
                <Input
                  placeholder="New section title..."
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSection();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  onClick={handleAddSection}
                  disabled={!newSectionTitle.trim()}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* ── DOI ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-doi" className="text-sm font-medium">
              DOI
            </label>
            <Input
              id="cpp-doi"
              value={formData.doi}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, doi: e.target.value }))
              }
              placeholder="e.g. 10.1000/xyz123"
            />
          </div>

          {/* ── Abstract ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-abstract" className="text-sm font-medium">
              Abstract
            </label>
            <textarea
              id="cpp-abstract"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="Enter abstract"
            />
          </div>

          {/* ── Paper Type ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-type" className="text-sm font-medium">
              Paper Type
            </label>
            <Input
              id="cpp-type"
              value={formData.paperType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paperType: e.target.value,
                }))
              }
              placeholder="e.g. Research, Review"
            />
          </div>

          {/* ── Status ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="cpp-status"
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: Number(e.target.value),
                }))
              }
            >
              {PAPER_INITIALIZE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </form>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-paper-in-project-form"
            disabled={initializeMutation.isPending || !formData.title.trim()}
            className={BTN.CREATE}
          >
            {initializeMutation.isPending ? 'Initializing...' : 'Initialize'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
