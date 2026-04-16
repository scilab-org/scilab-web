import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { FilterDropdown } from '@/components/ui/filter-dropdown';

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
import { PAPER_MANAGEMENT_QUERY_KEYS } from '../constants';
import { PROJECT_MANAGEMENT_QUERY_KEYS } from '@/features/project-management/constants';
import { usePaperTemplate } from '@/features/paper-template-management/api/get-paper-template';
import { PaperTemplateDto } from '@/features/paper-template-management/types';
import { useJournals } from '@/features/journal-management/api/get-journals';
import { JournalDto } from '@/features/journal-management/types';
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

const initialFormData = {
  title: '',
  context: '',
  abstract: '',
  researchGap: '',
  gapType: '',
  mainContribution: '',
  researchAim: '',
  selectedJournalId: '',
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
    id: selectedJournal?.templateId ?? '',
    queryConfig: { enabled: !!selectedJournal?.templateId },
  });

  // Populate sections when template loads or journal changes
  React.useEffect(() => {
    if (!selectedJournal?.templateId) {
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
  }, [templateDetailQuery.data, selectedJournal?.templateId]);

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
    setSections([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.context.trim()) return;
    if (!formData.abstract.trim()) return;
    if (!formData.researchGap.trim()) return;
    if (!formData.gapType.trim()) return;
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
      gapType: formData.gapType || undefined,
      mainContribution: formData.mainContribution || undefined,
      researchAim: formData.researchAim || undefined,
      status: formData.status,
      conferenceJournalName: selectedJournal?.name || undefined,
      conferenceJournalId: selectedJournal?.id || undefined,
      template: selectedJournal?.templateCode || undefined,
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
              Abstract <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cpp-abstract"
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.abstract}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, abstract: e.target.value }))
              }
              placeholder="e.g. This paper presents..."
              required
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
                setFormData((prev) => ({ ...prev, selectedJournalId: v }))
              }
              options={journalResults.map((j) => ({
                label: j.name,
                value: j.id,
              }))}
              placeholder="Select journal"
              clearLabel="No journal"
              variant="outline"
            />
            {selectedJournal && (
              <p className="text-muted-foreground text-xs">
                Style: {selectedJournal.style || 'No style'}
              </p>
            )}
          </div>

          {/* ── Sections from journal template ── */}
          {selectedJournal?.templateId && (
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
              !formData.abstract.trim() ||
              !formData.researchGap.trim() ||
              !formData.gapType.trim() ||
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
