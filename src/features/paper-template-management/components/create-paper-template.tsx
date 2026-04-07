import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { BTN } from '@/lib/button-styles';
import { normalizeLatexPackages } from '@/features/paper-management/lib/latex-packages';
import { useCreatePaperTemplate } from '../api/create-paper-template';
import { CreateTemplateSectionDto } from '../types';

const DEFAULT_SECTIONS: CreateTemplateSectionDto[] = [
  {
    key: 'abstract',
    title: 'Abstract',
    displayOrder: 1,
    latex: '\\section{\\textbf{Abstract}}',
    numbered: false,
    required: true,
    allowSubsections: false,
  },
  {
    key: 'background',
    title: 'Background & Summary',
    displayOrder: 2,
    latex: '\\section{\\textbf{Background \\& Summary}}',
    numbered: true,
    required: true,
    allowSubsections: true,
  },
  {
    key: 'methods',
    title: 'Methods',
    displayOrder: 3,
    latex: '\\section{\\textbf{Methods}}',
    numbered: true,
    required: true,
    allowSubsections: true,
  },
  {
    key: 'data_records',
    title: 'Data Records',
    displayOrder: 4,
    latex: '\\section{\\textbf{Data Records}}',
    numbered: true,
    required: true,
    allowSubsections: true,
  },
  {
    key: 'technical_validation',
    title: 'Technical Validation',
    displayOrder: 5,
    latex: '\\section{\\textbf{Technical Validation}}',
    numbered: true,
    required: false,
    allowSubsections: true,
  },
  {
    key: 'usage_notes',
    title: 'Usage Notes',
    displayOrder: 6,
    latex: '\\section{\\textbf{Usage Notes}}',
    numbered: true,
    required: false,
    allowSubsections: true,
  },
  {
    key: 'code_availability',
    title: 'Code Availability',
    displayOrder: 7,
    latex: '\\section{\\textbf{Code Availability}}',
    numbered: true,
    required: false,
    allowSubsections: false,
  },
  {
    key: 'references',
    title: 'References',
    displayOrder: 8,
    latex: '\\section{\\textbf{References}}',
    numbered: false,
    required: true,
    allowSubsections: false,
  },
];

const titleToKey = (title: string): string =>
  title
    .toLowerCase()
    .replace(/^\d+\.\s*/, '') // strip leading "1. "
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const initialFormData = {
  name: '',
  code: '',
  description: '',
};

type SectionRow = CreateTemplateSectionDto & { _id: string };

const makeSectionRow = (s: CreateTemplateSectionDto): SectionRow => ({
  ...s,
  description: s.description || '',
  packages: s.packages,
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
    field: keyof CreateTemplateSectionDto,
    value: string | boolean | number,
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s._id !== id) return s;
        const updated = { ...s, [field]: value };
        // auto-regenerate key and latex when title changes
        if (field === 'title') {
          updated.key = titleToKey(value as string);
          updated.latex = `\\section{\\textbf{${value}}}`;
        }
        return updated;
      }),
    );
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      makeSectionRow({
        key: '',
        title: '',
        displayOrder: prev.length + 1,
        numbered: false,
        allowSubsections: true,
        required: false,
        description: '',
      }),
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => {
      const updated = prev.filter((s) => s._id !== id);
      return updated.map((s, i) => ({ ...s, displayOrder: i + 1 }));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    mutation.mutate({
      name: formData.name.trim(),
      code: formData.code.trim(),
      description: formData.description.trim(),
      templateStructure: {
        templateCode: formData.code.trim(),
        sections: sections.map(({ _id, ...s }) => {
          let rule = s.rule || '';
          if (s.description && !s.rule) {
            const bulletPoints = s.description
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .map((line) => (line.startsWith('-') ? line : `- ${line}`))
              .join('\n');
            rule = `## ${s.title}\n${bulletPoints}`;
          }
          return {
            ...s,
            packages: normalizeLatexPackages(s.packages),
            rule,
          };
        }),
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm" className={BTN.CREATE}>
          <Plus className="size-4" />
          Create Template
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Create Paper Template</SheetTitle>
          <SheetDescription>
            Define the template structure with sections.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-pt-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-4"
        >
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="pt-name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="pt-name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. IMRAD STANDARD"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pt-code" className="text-sm font-medium">
                Code <span className="text-destructive">*</span>
              </label>
              <Input
                id="pt-code"
                value={formData.code}
                onChange={(e) =>
                  updateField('code', e.target.value.toUpperCase())
                }
                placeholder="e.g. IMRAD_STANDARD"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pt-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="pt-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Short description..."
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

            <div className="rounded-lg border">
              {/* Header */}
              <div className="bg-muted/50 grid grid-cols-[2rem_1fr_2rem] gap-2 border-b px-3 py-2 text-xs font-medium text-gray-500">
                <span>#</span>
                <span>Title</span>
                <span></span>
              </div>

              <div className="divide-y">
                {sections.map((section, idx) => (
                  <div key={section._id} className="space-y-1.5 px-3 py-2">
                    {/* Row 1: index / title / delete */}
                    <div className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {idx + 1}
                      </span>
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(section._id, 'title', e.target.value)
                        }
                        placeholder="Section title"
                        className="h-7 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-red-500 hover:text-red-600"
                        onClick={() => removeSection(section._id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                    {/* Row 2: boolean toggles */}
                    <div className="flex flex-wrap items-center gap-4 pl-8 text-xs">
                      <label className="flex cursor-pointer items-center gap-1 select-none">
                        <input
                          type="checkbox"
                          checked={section.required ?? false}
                          onChange={(e) =>
                            updateSection(
                              section._id,
                              'required',
                              e.target.checked,
                            )
                          }
                          className="size-3.5"
                        />
                        Required
                      </label>
                      <label className="flex cursor-pointer items-center gap-1 select-none">
                        <input
                          type="checkbox"
                          checked={section.numbered ?? false}
                          onChange={(e) =>
                            updateSection(
                              section._id,
                              'numbered',
                              e.target.checked,
                            )
                          }
                          className="size-3.5"
                        />
                        Numbered
                      </label>
                      <label className="flex cursor-pointer items-center gap-1 select-none">
                        <input
                          type="checkbox"
                          checked={section.allowSubsections ?? false}
                          onChange={(e) =>
                            updateSection(
                              section._id,
                              'allowSubsections',
                              e.target.checked,
                            )
                          }
                          className="size-3.5"
                        />
                        Allow Sub-sections
                      </label>
                    </div>
                    {/* Row 3: description */}
                    <div className="pt-1 pl-8">
                      <textarea
                        value={section.description || ''}
                        onChange={(e) =>
                          updateSection(
                            section._id,
                            'description',
                            e.target.value,
                          )
                        }
                        placeholder="Section description (optional)..."
                        rows={2}
                        className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-1.5 text-xs shadow-xs outline-none focus-visible:ring-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        <SheetFooter className="px-4 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-pt-form"
            disabled={
              mutation.isPending ||
              !formData.name.trim() ||
              !formData.code.trim()
            }
            className={BTN.CREATE}
          >
            {mutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
