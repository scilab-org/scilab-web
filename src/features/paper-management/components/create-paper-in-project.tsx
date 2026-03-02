import * as React from 'react';
import { X, Loader2, Search, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/utils/cn';

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

import { api } from '@/lib/api-client';
import { TagAutocompleteInput } from './tag-autocomplete-input';
import { BTN } from '@/lib/button-styles';
import {
  PAPER_STATUS_OPTIONS,
  PAPER_MANAGEMENT_API,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { usePaperTemplates } from '@/features/paper-template-management/api/get-paper-templates';
import { usePaperTemplate } from '@/features/paper-template-management/api/get-paper-template';
import { PaperTemplateDto } from '@/features/paper-template-management/types';

type SectionRow = {
  _id: string;
  title: string;
  parentId?: string;
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
  publicationDate: '',
  paperType: '',
  journalName: '',
  conferenceName: '',
  status: 5,
};

export const CreatePaperInProject = ({
  projectId: _projectId,
  open,
  onOpenChange,
}: CreatePaperInProjectProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState(initialFormData);
  const [tagList, setTagList] = React.useState<string[]>([]);

  // Template selector state
  const [templateCodeInput, setTemplateCodeInput] = React.useState('');
  const [templateSearch, setTemplateSearch] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<PaperTemplateDto | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = React.useState(false);

  // Sections editor state
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [newSectionTitle, setNewSectionTitle] = React.useState('');

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
      rawSections.map((s, i) => ({
        _id: `tpl-${i}-${s.key ?? s.title}`,
        title: s.title,
        allowSubsections: s.allowSubsections,
      })),
    );
  }, [templateDetailQuery.data]);

  // Mutation without file
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((item) => fd.append(k, String(item)));
        } else if (v !== undefined && v !== null && v !== '') {
          fd.append(k, String(v));
        }
      });
      return api.post(PAPER_MANAGEMENT_API.ADMIN_PAPERS, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
      });
      onOpenChange(false);
      resetForm();
      toast.success('Paper created successfully');
    },
    onError: () => {
      toast.error('Failed to create paper');
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setTagList([]);
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
    setSections((prev) => [
      ...prev,
      { _id: `custom-${Date.now()}`, title: trimmed },
    ]);
    setNewSectionTitle('');
  };

  const handleRemoveSection = (id: string) => {
    // Remove the section and any sub-sections belonging to it
    setSections((prev) =>
      prev.filter((s) => s._id !== id && s.parentId !== id),
    );
  };

  const handleAddSubSection = (parentId: string) => {
    setSections((prev) => {
      // Insert new sub-section after the last item that is this parent or its child
      let insertIdx = prev.length;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i]._id === parentId || prev[i].parentId === parentId) {
          insertIdx = i + 1;
          break;
        }
      }
      const next = [...prev];
      next.splice(insertIdx, 0, {
        _id: `sub-${Date.now()}`,
        title: '',
        parentId,
      });
      return next;
    });
  };

  const handleAddTag = (value: string) => {
    const trimmed = value.trim();
    if (
      trimmed &&
      !tagList.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setTagList((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (
      formData.publicationDate &&
      new Date(formData.publicationDate) > new Date()
    )
      return;
    createMutation.mutate({
      title: formData.title,
      abstract: formData.abstract,
      doi: formData.doi,
      publicationDate: formData.publicationDate || undefined,
      paperType: formData.paperType,
      journalName: formData.journalName,
      conferenceName: formData.conferenceName,
      parsedText: '',
      isAutoTagged: false,
      isIngested: false,
      status: formData.status,
      tagNames: tagList,
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create New Paper</SheetTitle>
          <SheetDescription>
            Select a template, fill in the details, and customise sections.
            Title is required.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-paper-in-project-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
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
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
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
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Section Title</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const mainNumMap = new Map<string, number>();
                        const subCountMap = new Map<string, number>();
                        let mainIdx = 0;
                        return sections.map((sec) => {
                          let displayNum: string;
                          const isSubSection = !!sec.parentId;
                          if (!isSubSection) {
                            mainIdx++;
                            mainNumMap.set(sec._id, mainIdx);
                            displayNum = String(mainIdx);
                          } else {
                            const parentNum =
                              mainNumMap.get(sec.parentId!) ?? 0;
                            const subCount =
                              (subCountMap.get(sec.parentId!) ?? 0) + 1;
                            subCountMap.set(sec.parentId!, subCount);
                            displayNum = `${parentNum}.${subCount}`;
                          }
                          return (
                            <TableRow
                              key={sec._id}
                              className={isSubSection ? 'bg-muted/30' : ''}
                            >
                              <TableCell
                                className={cn(
                                  'text-muted-foreground text-sm',
                                  isSubSection && 'pl-7',
                                )}
                              >
                                {displayNum}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={sec.title}
                                  onChange={(e) =>
                                    setSections((prev) =>
                                      prev.map((s) =>
                                        s._id === sec._id
                                          ? { ...s, title: e.target.value }
                                          : s,
                                      ),
                                    )
                                  }
                                  className="h-7 text-sm"
                                  placeholder={
                                    isSubSection
                                      ? 'Sub-section title...'
                                      : undefined
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-0.5">
                                  {!isSubSection &&
                                    sec.allowSubsections !== false && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        title="Add sub-section"
                                        className="size-6 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                                        onClick={() =>
                                          handleAddSubSection(sec._id)
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
                                    onClick={() => handleRemoveSection(sec._id)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
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

          {/* ── Tags ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tags {tagList.length > 0 && `(${tagList.length})`}
            </label>
            <TagAutocompleteInput
              tagList={tagList}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              placeholder="Type a tag and press Enter..."
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            {/* ── Publication Date ── */}
            <div className="space-y-1.5">
              <label htmlFor="cpp-pubdate" className="text-sm font-medium">
                Publication Date
              </label>
              <Input
                id="cpp-pubdate"
                type="datetime-local"
                value={formData.publicationDate}
                max={new Date().toISOString().slice(0, 16)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    publicationDate: e.target.value,
                  }))
                }
              />
              {formData.publicationDate &&
                new Date(formData.publicationDate) > new Date() && (
                  <p className="text-destructive text-xs">
                    Publication date cannot be in the future.
                  </p>
                )}
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
          </div>

          {/* ── Journal Name ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-journal" className="text-sm font-medium">
              Journal Name
            </label>
            <Input
              id="cpp-journal"
              value={formData.journalName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  journalName: e.target.value,
                }))
              }
              placeholder="Enter journal name"
            />
          </div>

          {/* ── Conference Name ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-conference" className="text-sm font-medium">
              Conference Name
            </label>
            <Input
              id="cpp-conference"
              value={formData.conferenceName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conferenceName: e.target.value,
                }))
              }
              placeholder="Enter conference name"
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
              {PAPER_STATUS_OPTIONS.map((opt) => (
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
            disabled={createMutation.isPending || !formData.title.trim()}
            className={BTN.CREATE}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
