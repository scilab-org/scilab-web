import * as React from 'react';
import { X, Loader2, Search, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  PAPER_INITIALIZE_STATUS_OPTIONS,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { PROJECT_MANAGEMENT_QUERY_KEYS } from '@/features/project-management/constants';
import { usePaperTemplates } from '@/features/paper-template-management/api/get-paper-templates';
import { usePaperTemplate } from '@/features/paper-template-management/api/get-paper-template';
import { PaperTemplateDto } from '@/features/paper-template-management/types';
import { useJournals } from '@/features/journal-management/api/get-journals';
import { JournalDto, JournalStyle } from '@/features/journal-management/types';
import { useCreatePaperInProject } from '../api/initialize-paper';
import { CreatePaperInProjectDto, PaperSection } from '../types';

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
  description?: string;
  rule?: string;
  allowSubsections?: boolean;
};

type CreatePaperInProjectProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialFormData = {
  title: '',
  context: '',
  abstract: '',
  researchGap: '',
  gapType: '',
  mainContribution: '',
  selectedJournalId: '',
  selectedStyleName: '',
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

  const journalsQuery = useJournals({
    params: { PageNumber: 1, PageSize: 200 },
    queryConfig: { enabled: open },
  });
  const journalResults: JournalDto[] = React.useMemo(
    () => journalsQuery.data?.result?.items ?? [],
    [journalsQuery.data?.result?.items],
  );

  const selectedJournal = React.useMemo(
    () =>
      journalResults.find((j) => j.id === formData.selectedJournalId) ?? null,
    [journalResults, formData.selectedJournalId],
  );

  const selectedStyle = React.useMemo<JournalStyle | null>(
    () =>
      selectedJournal?.styles?.find(
        (s) => s.name === formData.selectedStyleName,
      ) ?? null,
    [selectedJournal, formData.selectedStyleName],
  );

  React.useEffect(() => {
    if (!selectedJournal) return;
    const hasStyle = selectedJournal.styles?.some(
      (s) => s.name === formData.selectedStyleName,
    );
    if (!hasStyle) {
      setFormData((prev) => ({ ...prev, selectedStyleName: '' }));
    }
  }, [selectedJournal, formData.selectedStyleName]);

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
        const sectionPackages =
          s.packages ?? (s as { Packages?: string[] }).Packages ?? undefined;

        return {
          _id: `tpl-${sectionId}`,
          id: sectionId,
          title: s.title,
          latex: s.latex ?? toLatex(s.title, false),
          content: '',
          packages: sectionPackages ?? ['inputenc', 'fontenc'],
          numbered: s.numbered ?? true,
          displayOrder: s.displayOrder ?? s.order ?? i,
          sectionSumary: '',
          description: s.description ?? '',
          rule: s.rule ?? '',
          allowSubsections: s.allowSubsections,
        };
      }),
    );
  }, [templateDetailQuery.data]);

  // Mutation using create paper endpoint
  const createMutation = useCreatePaperInProject({
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
        toast.success('Paper created successfully');
      },
      onError: () => {
        toast.error('Failed to create paper');
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
          description: '',
          rule: '',
          parentSectionId: parentSection.id,
        },
      ];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.context.trim()) return;
    if (!formData.abstract.trim()) return;
    if (!formData.researchGap.trim()) return;
    if (!formData.gapType.trim()) return;
    if (!formData.mainContribution.trim()) return;

    const payload: CreatePaperInProjectDto = {
      projectId: _projectId,
      title: formData.title,
      context: formData.context,
      abstract: formData.abstract || undefined,
      researchGap: formData.researchGap || undefined,
      gapType: formData.gapType || undefined,
      mainContribution: formData.mainContribution || undefined,
      status: formData.status,
      journal:
        selectedJournal && selectedStyle
          ? {
              name: selectedJournal.name,
              styleName: selectedStyle.name,
              styleDescription: selectedStyle.description || undefined,
              styleRule: selectedStyle.rule || undefined,
            }
          : undefined,
      ...(selectedTemplate?.code && { template: selectedTemplate.code }),
      sections: sections.map((sec) => {
        return {
          id: sec.id,
          title: sec.title || '',
          content: sec.latex || sec.content || '',
          packages: sec.packages ?? ['inputenc', 'fontenc'],
          numbered: sec.numbered,
          displayOrder: sec.displayOrder,
          sectionSumary: sec.sectionSumary || '',
          description: sec.description || '',
          rule: sec.rule || '',
          ...(sec.parentSectionId && { parentSectionId: sec.parentSectionId }),
        };
      }),
    };

    createMutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Paper</DialogTitle>
          <DialogDescription>
            Select a template, fill in the details, and customize sections.
            Title and context are required.
          </DialogDescription>
        </DialogHeader>

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

          <div className="space-y-1.5">
            <label htmlFor="cpp-context" className="text-sm font-medium">
              Context <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-context"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.context}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, context: e.target.value }))
              }
              placeholder="Enter paper context"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-abstract" className="text-sm font-medium">
              Abstract <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-abstract"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="Enter abstract"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-research-gap" className="text-sm font-medium">
              Research Gap <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-research-gap"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.researchGap}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  researchGap: e.target.value,
                }))
              }
              placeholder="Enter research gap"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-gap-type" className="text-sm font-medium">
              Gap Type <span className="text-destructive">*</span>
            </label>
            <Input
              id="cpp-gap-type"
              value={formData.gapType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gapType: e.target.value }))
              }
              placeholder="e.g. Methodological, Empirical"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cpp-main-contribution"
              className="text-sm font-medium"
            >
              Main Contribution <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-main-contribution"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.mainContribution}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  mainContribution: e.target.value,
                }))
              }
              placeholder="Enter main contribution"
              required
            />
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Journal</p>
            <div className="space-y-1.5">
              <label htmlFor="cpp-journal-id" className="text-sm font-medium">
                Select Journal
              </label>
              <select
                id="cpp-journal-id"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={formData.selectedJournalId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    selectedJournalId: e.target.value,
                    selectedStyleName: '',
                  }))
                }
              >
                <option value="">No journal</option>
                {journalResults.map((journal) => (
                  <option key={journal.id} value={journal.id}>
                    {journal.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cpp-style-name" className="text-sm font-medium">
                Select Style
              </label>
              <select
                id="cpp-style-name"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={formData.selectedStyleName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    selectedStyleName: e.target.value,
                  }))
                }
                disabled={!selectedJournal}
              >
                <option value="">No style</option>
                {(selectedJournal?.styles ?? []).map((style) => (
                  <option key={style.name} value={style.name}>
                    {style.name}
                  </option>
                ))}
              </select>
              {selectedJournal &&
                (selectedJournal.styles?.length ?? 0) === 0 && (
                  <p className="text-muted-foreground text-xs">
                    This journal has no styles.
                  </p>
                )}
            </div>
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
                    variant="ghost"
                    size="sm"
                    onClick={handleResetTemplateSearch}
                    className="uppercase"
                  >
                    RESET
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="uppercase"
                    onClick={handleSearchTemplate}
                  >
                    <Search className="size-4" />
                    SEARCH
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
                <div className="rounded-xl border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                        <TableHead className="w-8 font-semibold text-green-900 dark:text-green-200">
                          #
                        </TableHead>
                        <TableHead className="font-semibold text-green-900 dark:text-green-200">
                          Section Title
                        </TableHead>
                        <TableHead className="w-16" />
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
                              <TableCell className="py-2">
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
                              <TableCell className="py-2">
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

                            {/* Description row – spans below title, full width */}
                            {mainSection.description !== undefined && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell className="pt-0 pb-2" />
                                <TableCell colSpan={2} className="pt-0 pb-2">
                                  <textarea
                                    value={mainSection.description ?? ''}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        prev.map((section) =>
                                          section._id === mainSection._id
                                            ? {
                                                ...section,
                                                description: e.target.value,
                                              }
                                            : section,
                                        ),
                                      )
                                    }
                                    rows={2}
                                    placeholder="Section description..."
                                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-1.5 text-xs shadow-xs outline-none focus-visible:ring-2"
                                  />
                                </TableCell>
                              </TableRow>
                            )}

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
                                  <div className="space-y-2 pl-3">
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
            </div>
          )}

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

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="uppercase"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-paper-in-project-form"
            disabled={
              createMutation.isPending ||
              !formData.title.trim() ||
              !formData.context.trim() ||
              !formData.abstract.trim() ||
              !formData.researchGap.trim() ||
              !formData.gapType.trim() ||
              !formData.mainContribution.trim()
            }
            variant="secondary"
            className="uppercase"
          >
            {createMutation.isPending ? 'CREATING...' : 'CREATE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
