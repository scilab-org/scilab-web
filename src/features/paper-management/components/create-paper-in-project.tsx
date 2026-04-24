import * as React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Badge } from '@/components/ui/badge';

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
import { cn } from '@/utils/cn';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { PROJECT_MANAGEMENT_QUERY_KEYS } from '@/features/project-management/constants';
import { TASK_MANAGEMENT_QUERY_KEYS } from '@/features/task-management/constants';
import { usePaperTemplate } from '@/features/paper-template-management/api/get-paper-template';
import { PaperTemplateDto } from '@/features/paper-template-management/types';
import { useJournals } from '@/features/journal-management/api/get-journals';
import { JournalDto } from '@/features/journal-management/types';
import { useGapTypes } from '@/features/gap-type-management/api/get-gap-types';
import { useCreatePaperInProject } from '../api/initialize-paper';
import { CreatePaperInProjectDto } from '../types';

type SectionRow = {
  title: string;
  displayOrder: number;
  sectionRule: string;
  mainIdea: string;
};

type CreatePaperInProjectProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const initialFormData = {
  title: '',
  context: '',
  abstract: '',
  researchGap: '',
  gapTypeIds: [] as string[],
  mainContribution: '',
  researchAim: '',
  selectedJournalId: '',
  conferenceJournalStartAt: '',
  conferenceJournalEndAt: '',
  status: 1,
};

export const CreatePaperInProject = ({
  projectId: _projectId,
  open,
  onOpenChange,
}: CreatePaperInProjectProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState(initialFormData);

  // Sections editor state
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [gapTypeSearch, setGapTypeSearch] = React.useState('');
  const [isGapTypeOpen, setIsGapTypeOpen] = React.useState(false);
  const gapTypeInputRef = React.useRef<HTMLInputElement | null>(null);
  const gapTypeComboboxRef = React.useRef<HTMLDivElement | null>(null);

  const gapTypesQuery = useGapTypes({
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: open },
  });
  const gapTypes = React.useMemo(
    () => gapTypesQuery.data?.result?.items ?? [],
    [gapTypesQuery.data?.result?.items],
  );
  const selectedGapTypes = React.useMemo(
    () =>
      gapTypes.filter((gapType) => formData.gapTypeIds.includes(gapType.id)),
    [gapTypes, formData.gapTypeIds],
  );
  const filteredGapTypes = React.useMemo(() => {
    const query = gapTypeSearch.trim().toLowerCase();
    const available = gapTypes.filter(
      (gapType) => !formData.gapTypeIds.includes(gapType.id),
    );
    if (!query) return available;
    return available.filter((gapType) =>
      gapType.name.toLowerCase().includes(query),
    );
  }, [gapTypes, gapTypeSearch, formData.gapTypeIds]);

  // Fetch journals
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

  // Fetch template detail from journal's templateId
  const templateDetailQuery = usePaperTemplate({
    id: selectedJournal?.templates?.[0]?.id ?? '',
    queryConfig: { enabled: !!selectedJournal?.templates?.[0]?.id },
  });

  // Populate sections when template loads or journal changes
  React.useEffect(() => {
    if (!selectedJournal?.templates?.[0]?.id) {
      setSections([]);
      return;
    }
    const detail = (templateDetailQuery.data as any)?.result?.template as
      | PaperTemplateDto
      | undefined;
    if (!detail) return;
    const rawSections = detail.sections ?? [];
    setSections(
      rawSections
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((s) => ({
          title: s.title,
          displayOrder: s.displayOrder,
          sectionRule: s.sectionRule ?? '',
          mainIdea: '',
        })),
    );
  }, [selectedJournal?.templates, templateDetailQuery.data]);

  // Mutation using create paper endpoint
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isGapTypeOpen &&
        gapTypeComboboxRef.current &&
        !gapTypeComboboxRef.current.contains(event.target as Node)
      ) {
        setIsGapTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGapTypeOpen]);

  React.useEffect(() => {
    if (!isGapTypeOpen) setGapTypeSearch('');
  }, [isGapTypeOpen]);

  React.useEffect(() => {
    if (!open) return;
    const matchedGapType = gapTypes.find(
      (gapType) =>
        gapType.name.toLowerCase() === gapTypeSearch.trim().toLowerCase(),
    );
    if (matchedGapType && !formData.gapTypeIds.includes(matchedGapType.id)) {
      setFormData((prev) => ({
        ...prev,
        gapTypeIds: [...prev.gapTypeIds, matchedGapType.id],
      }));
      setGapTypeSearch('');
    }
  }, [gapTypeSearch, gapTypes, formData.gapTypeIds, open]);

  const createMutation = useCreatePaperInProject({
    mutationConfig: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPERS],
        });
        queryClient.invalidateQueries({
          queryKey: [PROJECT_MANAGEMENT_QUERY_KEYS.SUB_PROJECTS, _projectId],
        });
        queryClient.invalidateQueries({
          queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_ASSIGNED_PAPERS],
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
    setSections([]);
    setGapTypeSearch('');
    setIsGapTypeOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.context.trim()) return;
    if (!formData.researchGap.trim()) return;
    if (!formData.gapTypeIds.length) return;
    if (!formData.mainContribution.trim()) return;
    if (!formData.researchAim.trim()) return;
    if (!formData.selectedJournalId) return;
    if (sections.some((s) => !s.mainIdea.trim())) return;

    const payload: CreatePaperInProjectDto = {
      projectId: _projectId,
      title: formData.title,
      context: formData.context,
      abstract: formData.abstract || undefined,
      researchGap: formData.researchGap || undefined,
      gapTypeIds: formData.gapTypeIds,
      mainContribution: formData.mainContribution || undefined,
      researchAim: formData.researchAim || undefined,
      status: formData.status,
      conferenceJournalName: selectedJournal?.name || undefined,
      conferenceJournalId: selectedJournal?.id || undefined,
      conferenceJournalStartAt: formData.conferenceJournalStartAt
        ? new Date(formData.conferenceJournalStartAt).toISOString()
        : null,
      conferenceJournalEndAt: formData.conferenceJournalEndAt
        ? new Date(formData.conferenceJournalEndAt).toISOString()
        : null,
      template: selectedJournal?.templates?.[0]?.code || undefined,
      sections: sections.map((sec) => ({
        title: sec.title,
        displayOrder: sec.displayOrder,
        sectionRule: sec.sectionRule || undefined,
        mainIdea: sec.mainIdea || undefined,
      })),
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
      <DialogContent className="scrollbar-dialog max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Paper</DialogTitle>
          <DialogDescription>
            Fill in the details. All fill are required. Select a Journal /
            Conference to apply its structure as the initial sections and fill
            all main idea for this.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-paper-in-project-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-4 py-4"
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
              placeholder="e.g. A Study on..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-context" className="text-sm font-medium">
              Context <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-context"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.context}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, context: e.target.value }))
              }
              placeholder="e.g. This paper focuses on..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-abstract" className="text-sm font-medium">
              Abstract
            </label>
            <textarea
              id="cpp-abstract"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="e.g. This paper presents..."
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-research-gap" className="text-sm font-medium">
              Research Gap <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-research-gap"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.researchGap}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  researchGap: e.target.value,
                }))
              }
              placeholder="e.g. Lack of studies on..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-gap-type" className="text-sm font-medium">
              Gap Types <span className="text-destructive">*</span>
            </label>
            <div ref={gapTypeComboboxRef} className="relative">
              <div
                role="combobox"
                tabIndex={0}
                aria-expanded={isGapTypeOpen}
                aria-controls="create-paper-in-project-gap-types-listbox"
                className={cn(
                  'border-input text-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]',
                )}
                onClick={() => gapTypeInputRef.current?.focus()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    gapTypeInputRef.current?.focus();
                  }
                }}
              >
                {selectedGapTypes.map((gapType) => (
                  <Badge
                    key={gapType.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
                  >
                    {gapType.name}
                    <button
                      type="button"
                      className="text-white/80 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormData((prev) => ({
                          ...prev,
                          gapTypeIds: prev.gapTypeIds.filter(
                            (id) => id !== gapType.id,
                          ),
                        }));
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={gapTypeInputRef}
                  id="create-paper-in-project-gap-type"
                  value={gapTypeSearch}
                  onFocus={() => setIsGapTypeOpen(true)}
                  onChange={(e) => {
                    setGapTypeSearch(e.target.value);
                    setIsGapTypeOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      setIsGapTypeOpen(true);
                    }
                    if (e.key === 'Escape') {
                      setIsGapTypeOpen(false);
                    }
                    if (
                      e.key === 'Backspace' &&
                      !gapTypeSearch &&
                      selectedGapTypes.length > 0
                    ) {
                      setFormData((prev) => ({
                        ...prev,
                        gapTypeIds: prev.gapTypeIds.slice(0, -1),
                      }));
                    }
                  }}
                  placeholder={
                    gapTypeSearch.trim()
                      ? ''
                      : selectedGapTypes.length > 0
                        ? 'Add more gap types...'
                        : 'Search gap types...'
                  }
                  autoComplete="off"
                  className={cn(
                    'flex h-5 min-w-24 flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0',
                    gapTypeSearch.trim() || selectedGapTypes.length > 0
                      ? 'placeholder:text-transparent'
                      : 'placeholder:text-muted-foreground/50',
                  )}
                />
              </div>
              {isGapTypeOpen && (
                <div
                  id="create-paper-in-project-gap-types-listbox"
                  role="listbox"
                  className="bg-background absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-sm"
                >
                  {filteredGapTypes.length > 0 ? (
                    filteredGapTypes.map((gapType) => (
                      <button
                        key={gapType.id}
                        type="button"
                        className="hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            gapTypeIds: [...prev.gapTypeIds, gapType.id],
                          }));
                          setGapTypeSearch('');
                          setIsGapTypeOpen(false);
                        }}
                      >
                        <span>{gapType.name}</span>
                        <Check className="size-4 opacity-0" />
                      </button>
                    ))
                  ) : (
                    <div className="text-muted-foreground px-3 py-2 text-xs">
                      No gap types found.
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.mainContribution}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  mainContribution: e.target.value,
                }))
              }
              placeholder="e.g. A novel framework for..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cpp-research-aim" className="text-sm font-medium">
              Research Aim <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-research-aim"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.researchAim}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  researchAim: e.target.value,
                }))
              }
              placeholder="e.g. To investigate the relationship between..."
              required
            />
          </div>

          {/* ── Journal ── */}
          <div className="space-y-1.5">
            <label htmlFor="cpp-journal-id" className="text-sm font-medium">
              Journal <span className="text-destructive">*</span>
            </label>
            <FilterDropdown
              value={formData.selectedJournalId}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  selectedJournalId: v,
                  conferenceJournalStartAt: toDateTimeLocalValue(
                    journalResults.find((journal) => journal.id === v)
                      ?.conferenceJournalStartAt,
                  ),
                  conferenceJournalEndAt: toDateTimeLocalValue(
                    journalResults.find((journal) => journal.id === v)
                      ?.conferenceJournalEndAt,
                  ),
                }))
              }
              options={journalResults.map((j) => ({
                label: j.name,
                value: j.id,
              }))}
              placeholder="Select journal"
              clearLabel="No journal"
              variant="outline"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="cpp-conference-journal-start-at"
                className="text-sm font-medium"
              >
                Conference / Journal Start
              </label>
              <Input
                id="cpp-conference-journal-start-at"
                type="datetime-local"
                value={formData.conferenceJournalStartAt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    conferenceJournalStartAt: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="cpp-conference-journal-end-at"
                className="text-sm font-medium"
              >
                Conference / Journal End
              </label>
              <Input
                id="cpp-conference-journal-end-at"
                type="datetime-local"
                value={formData.conferenceJournalEndAt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    conferenceJournalEndAt: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* ── Sections from journal template ── */}
          {selectedJournal?.templates?.[0]?.id && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sections
                {sections.length > 0 && (
                  <span className="text-muted-foreground ml-1 font-normal">
                    ({sections.length})
                  </span>
                )}{' '}
                <span className="text-destructive">*</span>
              </label>

              {templateDetailQuery.isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading sections...
                </div>
              ) : sections.length > 0 ? (
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-md border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex w-5 shrink-0 items-center justify-center">
                          <span className="text-muted-foreground text-xs font-medium">
                            {section.displayOrder}
                          </span>
                        </div>
                        <p className="flex-1 text-sm font-medium">
                          {section.title}{' '}
                          <span className="text-destructive">*</span>
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <textarea
                          value={section.mainIdea}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((s, i) =>
                                i === index
                                  ? { ...s, mainIdea: e.target.value }
                                  : s,
                              ),
                            )
                          }
                          rows={6}
                          required
                          placeholder="e.g. This section covers..."
                          className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* ── Status ── */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Status</p>
            <div className="border-input bg-muted/30 text-foreground flex min-h-10 items-center rounded-md border px-3 text-sm">
              Draft
            </div>
            <p className="text-muted-foreground text-xs">
              New papers are created in Draft status.
            </p>
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
              !formData.researchGap.trim() ||
              !formData.gapTypeIds.length ||
              !formData.mainContribution.trim() ||
              !formData.researchAim.trim() ||
              !formData.selectedJournalId ||
              sections.some((s) => !s.mainIdea.trim())
            }
            variant="darkRed"
            className="uppercase"
          >
            {createMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
