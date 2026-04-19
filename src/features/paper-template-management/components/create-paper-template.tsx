import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { CreateButton } from '@/components/ui/create-button';

import { useCreatePaperTemplate } from '../api/create-paper-template';
import { CreateTemplateSectionInput } from '../types';

const DEFAULT_SECTIONS: CreateTemplateSectionInput[] = [
  {
    title: 'Abstract',
    sectionRule:
      '- Provide a clear and concise summary of the entire paper.\n' +
      '- Include purpose, scope, and key findings.\n' +
      '- Mention methodology if relevant.\n' +
      '- Ensure the abstract is self-contained and easy to read.\n' +
      '- Highlight main contributions without unnecessary detail.\n' +
      '- Keep concise (150–250 words).\n' +
      '- Context setting should not exceed 25% of the abstract; prioritize new information.\n' +
      '- Do not begin with cliché phrases such as "This paper deals with..." or "The aim of this paper..."; go straight to the point.\n' +
      '- Avoid including references, citations, or detailed mathematical equations in the abstract.\n' +
      '- Ensure the reader can immediately understand the contribution and significance of the work.',
    displayOrder: 1,
  },
  {
    title: 'Introduction',
    sectionRule:
      '- Provide a clear roadmap for understanding the motivation and significance of your experiments.\n' +
      '- State the research problem and objectives clearly in the first few paragraphs.\n' +
      '- Define technical terms, notation, and key words here so the reader has the tools to understand the paper.\n' +
      '- Keep background information focused; include only what is necessary for the reader to understand why you are asking your specific research questions.\n' +
      '- Differentiate from the Abstract; do not simply cut and paste text from the Abstract into the Introduction.\n' +
      '- Use the "present simple" for established knowledge and the "past simple" or "present simple" when stating your specific findings or explanations.',
    displayOrder: 2,
  },
  {
    title: 'Review of the Literature',
    sectionRule:
      '- Systematically elaborate on achievements and limitations of previous studies to motivate your research.\n' +
      '- Identify the knowledge gap that your work intends to fill.\n' +
      '- Show progress through the years by structuring the review chronologically or by subtopic.\n' +
      '- Avoid unnecessary redundancy; do not use long phrases like "It has been reported in the literature that..." when a simple citation is sufficient.\n' +
      '- Be constructive and diplomatic when discussing the limitations of others\' work to maintain "face saving" for fellow researchers.\n' +
      '- Use the "present perfect" to refer to ongoing research situations and the "past simple" for specific finished experiments or results.',
    displayOrder: 3,
  },
  {
    title: 'Methodology',
    sectionRule:
      '- Provide sufficient detail to allow other researchers to replicate your work exactly.\n' +
      '- Organize the section chronologically, following the order in which you conducted the experiments.\n' +
      '- Avoid writing the section as a step-by-step protocol or a series of lists; it should read as a natural narrative of what was performed.\n' +
      '- Limit information density; generally include no more than two actions or steps in a single sentence.\n' +
      '- Use the "past simple" and the "passive form" typically, as the focus is on what was done rather than who did it.\n' +
      "- Be precise with quantifications (temperature, weight, time, etc.) and follow the journal's guidelines for using digits versus words for numbers.",
    displayOrder: 4,
  },
  {
    title: 'Results',
    sectionRule:
      '- Present representative findings simply and clearly, typically without interpretation or discussion if it is a separate section.\n' +
      '- Include important negative data; finding that something does not work is still useful information.\n' +
      '- Sequence your findings to follow the same order as the procedures described in your Methods section.\n' +
      '- Use figures and tables to summarize data; the text should highlight trends and key results rather than repeating every value found in the tables.\n' +
      '- Comment on the meaning of figures, not just their existence; for example, "Abundances were inversely related (Figure 4)" is better than "Figure 4 shows the relationship...".\n' +
      '- Use the "past simple" to report what you found during your experiments.',
    displayOrder: 5,
  },
  {
    title: 'Discussion',
    sectionRule:
      '- Interpret your results and relate them to the literature without merely repeating the data from the Results section.\n' +
      '- Address whether your data support your original hypotheses and discuss any alternative interpretations.\n' +
      '- Be upfront about limitations and potential bias; admitting what went wrong can actually increase your credibility as a researcher.\n' +
      '- Clearly distinguish your work from others by using "we" or "our" versus "they" or the names of other authors.\n' +
      '- Balance "highlighting" and "hedging"; use dynamic language to show achievements but cautious language (e.g., "suggests", "may", "appears") for propositions that are not 100% proven.\n' +
      '- End with a summary of main points, recommendations, and suggestions for future research.',
    displayOrder: 6,
  },
  {
    title: 'Conclusion',
    sectionRule:
      '- Provide a high-impact "take-home message" that summarizes the most important findings and their significance.\n' +
      '- Do not merely repeat the Abstract or Introduction; this section is for a reader who has already processed the rest of the paper.\n' +
      '- Cover practical applications and recommendations for policy changes or future work.\n' +
      '- Keep it brief, generally not exceeding one or two paragraphs.\n' +
      '- Avoid cliché openings like "In this study it is concluded that..."; go straight to the main topic.\n' +
      '- Use the "present perfect" for what you have done in the paper (e.g., "We have described...") and the "past simple" for what you did in the laboratory or field.',
    displayOrder: 7,
  },
  {
    title: 'References',
    sectionRule:
      '- Include all cited works.\n' +
      '- Ensure references are accurate.\n' +
      '- Follow a consistent citation format.\n' +
      '- Match references with in-text citations.\n' +
      '- Keep only relevant sources.',
    displayOrder: 8,
  },
];

const initialFormData = {
  code: '',
  description: '',
};

type SectionRow = CreateTemplateSectionInput & { _id: string };

const makeSectionRow = (s: CreateTemplateSectionInput): SectionRow => ({
  ...s,
  _id: crypto.randomUUID(),
});

export const CreatePaperTemplate = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [sections, setSections] = React.useState<SectionRow[]>(() =>
    DEFAULT_SECTIONS.map(makeSectionRow),
  );

  const mutation = useCreatePaperTemplate({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
        toast.success('Paper template created successfully');
      },
      onError: () => {
        toast.error('Failed to create paper template');
      },
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setSections(DEFAULT_SECTIONS.map(makeSectionRow));
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) resetForm();
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSection = (
    id: string,
    field: keyof CreateTemplateSectionInput,
    value: string,
  ) => {
    setSections((prev) =>
      prev.map((s) => (s._id !== id ? s : { ...s, [field]: value })),
    );
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      makeSectionRow({
        title: '',
        sectionRule: '',
        displayOrder: prev.length + 1,
      }),
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => {
      const updated = prev.filter((s) => s._id !== id);
      return updated.map((s, i) => ({ ...s, displayOrder: i + 1 }));
    });
  };

  const dragItemRef = React.useRef<number | null>(null);
  const dragOverItemRef = React.useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragItemRef.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverItemRef.current = idx;
  };

  const handleDrop = () => {
    const from = dragItemRef.current;
    const to = dragOverItemRef.current;
    if (from === null || to === null || from === to) {
      dragItemRef.current = null;
      dragOverItemRef.current = null;
      return;
    }
    setSections((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(from, 1);
      updated.splice(to, 0, dragged);
      return updated.map((s, i) => ({ ...s, displayOrder: i + 1 }));
    });
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    mutation.mutate({
      code: formData.code.trim(),
      description: formData.description.trim(),
      sections: sections.map(({ _id, ...s }) => s),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <CreateButton size="sm" className="uppercase">
          CREATE TEMPLATE
        </CreateButton>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Create Paper Template</DialogTitle>
            <DialogDescription>
              Define the template structure with sections.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          id="create-pt-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-5 overflow-y-auto px-6 py-4"
        >
          {/* Basic info */}
          <div className="space-y-1.5">
            <label htmlFor="pt-code" className="text-sm font-medium">
              Code <span className="text-destructive">*</span>
            </label>
            <Input
              id="pt-code"
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value)}
              placeholder="e.g. IMRAD"
              required
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pt-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="pt-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Short description..."
              rows={3}
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Sections{' '}
                <span className="text-muted-foreground font-normal">
                  ({sections.length})
                </span>
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addSection}
                className="gap-1"
              >
                <Plus className="size-3.5" />
                Add Section
              </Button>
            </div>

            <div className="space-y-2">
              {sections.map((section, idx) => (
                <div
                  key={section._id}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="space-y-3 rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex w-5 shrink-0 items-center justify-center">
                      <span className="text-muted-foreground text-xs font-medium">
                        {section.displayOrder}
                      </span>
                    </div>
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(section._id, 'title', e.target.value)
                      }
                      placeholder="Section title"
                      required
                      onDragStart={(e) => e.stopPropagation()}
                      className="h-10 flex-1 rounded-md text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-red-500 hover:text-red-600"
                      onClick={() => removeSection(section._id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      className="flex w-5 shrink-0 cursor-grab justify-center pt-3"
                      aria-label="Drag section"
                    >
                      <div className="grid grid-cols-2 gap-x-0.5 gap-y-0.5">
                        <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                        <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                        <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                        <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                        <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                        <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                      </div>
                    </div>
                    <textarea
                      value={section.sectionRule}
                      onChange={(e) =>
                        updateSection(
                          section._id,
                          'sectionRule',
                          e.target.value,
                        )
                      }
                      placeholder="Rule"
                      required
                      rows={6}
                      onDragStart={(e) => e.stopPropagation()}
                      className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-36 w-full resize-none rounded-md border bg-transparent px-4 py-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 px-6 pt-2 pb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="uppercase"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-pt-form"
            disabled={mutation.isPending || !formData.code.trim()}
            variant="darkRed"
            className="uppercase"
          >
            {mutation.isPending ? 'CREATING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
