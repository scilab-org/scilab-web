import * as React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useUpdatePaperTemplate } from '../api/update-paper-template';
import { PaperTemplateDto, CreateTemplateSectionDto } from '../types';

const titleToKey = (title: string): string =>
  title
    .toLowerCase()
    .replace(/^\d+\.\s*/, '') // strip leading "1. "
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

type SectionRow = CreateTemplateSectionDto & { _id: string };

const makeSectionRow = (s: CreateTemplateSectionDto): SectionRow => ({
  ...s,
  description: s.description || '',
  _id: crypto.randomUUID(),
});

type UpdatePaperTemplateProps = {
  template: PaperTemplateDto;
};

export const UpdatePaperTemplate = ({ template }: UpdatePaperTemplateProps) => {
  const [open, setOpen] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [sections, setSections] = React.useState<SectionRow[]>([]);

  const mutation = useUpdatePaperTemplate({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Template updated successfully');
      },
      onError: () => {
        toast.error('Failed to update template');
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setDescription(template.description || '');
      setSections(
        (template.templateStructure?.sections ?? []).map((s) =>
          makeSectionRow({
            key: s.key,
            title: s.title,
            displayOrder: s.displayOrder ?? s.order ?? 0,
            latex: s.latex,
            numbered: s.numbered ?? false,
            allowSubsections: s.allowSubsections ?? false,
            required: s.required,
            description: s.description || '',
            rule: s.rule || '',
          }),
        ),
      );
    }
  }, [open, template]);

  const updateSection = (
    id: string,
    field: keyof CreateTemplateSectionDto,
    value: string | boolean | number,
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s._id !== id) return s;
        const updated = { ...s, [field]: value };
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
    mutation.mutate({
      id: template.id,
      data: {
        description: description.trim(),
        templateStructure: {
          templateCode:
            template.templateStructure?.templateCode || template.code,
          sections: sections.map(({ _id, ...s }) => {
            let rule = s.rule || '';
            if (s.description) {
              const bulletPoints = s.description
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((line) => (line.startsWith('-') ? line : `- ${line}`))
                .join('\n');
              rule = `## ${s.title}\n${bulletPoints}`;
            }
            return { ...s, rule };
          }),
        },
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={BTN.EDIT_OUTLINE}>
          <Pencil className="size-4" />
          Edit
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Edit Template</SheetTitle>
          <SheetDescription>
            Update &quot;{template.name}&quot;
          </SheetDescription>
        </SheetHeader>

        <form
          id="update-pt-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-4"
        >
          {/* Read-only info */}
          <div className="bg-muted/40 grid gap-3 rounded-lg p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs">Name</p>
              <p className="font-medium">{template.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Code</p>
              <p className="font-mono">{template.code}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="upt-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="upt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                        className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-1.5 text-xs shadow-xs outline-none focus-visible:ring-[2px]"
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
            onClick={() => setOpen(false)}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="update-pt-form"
            disabled={mutation.isPending}
            className={BTN.EDIT}
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
