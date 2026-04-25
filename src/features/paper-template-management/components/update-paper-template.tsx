import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
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

import { useUpdatePaperTemplate } from '../api/update-paper-template';
import { PaperTemplateDto, CreateTemplateSectionInput } from '../types';

type SectionRow = CreateTemplateSectionInput & { _id: string };

const makeSectionRow = (s: CreateTemplateSectionInput): SectionRow => ({
  ...s,
  _id: crypto.randomUUID(),
});

const normalizeTitleForCompare = (title: string) =>
  title.trim().replace(/\s+/g, ' ');

const isReferenceTitle = (title: string) => {
  const normalized = normalizeTitleForCompare(title).toLowerCase();
  return normalized === 'reference' || normalized === 'references';
};

const reorderSectionsWithReferenceLast = (items: SectionRow[]) => {
  const normalSections = items.filter(
    (section) => !isReferenceTitle(section.title),
  );
  const referenceSections = items.filter((section) =>
    isReferenceTitle(section.title),
  );

  return [...normalSections, ...referenceSections].map((section, index) => ({
    ...section,
    displayOrder: index + 1,
  }));
};

type UpdatePaperTemplateProps = {
  template: PaperTemplateDto;
};

export const UpdatePaperTemplate = ({ template }: UpdatePaperTemplateProps) => {
  const [open, setOpen] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [pendingScrollSectionId, setPendingScrollSectionId] = React.useState<
    string | null
  >(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const sectionCardRefs = React.useRef<Record<string, HTMLDivElement | null>>(
    {},
  );

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
        reorderSectionsWithReferenceLast(
          (template.sections ?? [])
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((s) =>
              makeSectionRow({
                title: s.title,
                sectionRule: s.sectionRule,
                displayOrder: s.displayOrder,
              }),
            ),
        ),
      );
      setPendingScrollSectionId(null);
    }
  }, [open, template]);

  const updateSection = (
    id: string,
    field: keyof CreateTemplateSectionInput,
    value: string,
  ) => {
    setSections((prev) => {
      if (field !== 'title') {
        return prev.map((s) => (s._id !== id ? s : { ...s, [field]: value }));
      }

      const targetSection = prev.find((s) => s._id === id);
      if (!targetSection) return prev;

      const nextIsReference = isReferenceTitle(value);
      const currentIsReference = isReferenceTitle(targetSection.title);
      const referenceCount = prev.filter((s) =>
        isReferenceTitle(s.title),
      ).length;

      if (!currentIsReference && nextIsReference && referenceCount >= 1) {
        toast.error('Only one section can be named Reference or References.');
        return prev;
      }

      if (currentIsReference && !nextIsReference && referenceCount <= 1) {
        toast.error(
          'Template must contain one Reference or References section.',
        );
        return prev;
      }

      const updated = prev.map((s) =>
        s._id !== id ? s : { ...s, [field]: value },
      );
      return reorderSectionsWithReferenceLast(updated);
    });
  };

  const addSection = () => {
    const newSectionId = crypto.randomUUID();
    const referenceIndex = sections.findIndex((s) => isReferenceTitle(s.title));
    const insertAt = referenceIndex === -1 ? sections.length : referenceIndex;

    setPendingScrollSectionId(newSectionId);
    setSections((prev) => {
      const updated = [...prev];
      updated.splice(insertAt, 0, {
        _id: newSectionId,
        title: '',
        sectionRule: '',
        displayOrder: insertAt + 1,
      });
      return reorderSectionsWithReferenceLast(updated);
    });
  };

  const removeSection = (id: string) => {
    setSections((prev) => {
      const targetSection = prev.find((s) => s._id === id);
      if (!targetSection) return prev;

      if (isReferenceTitle(targetSection.title)) {
        const referenceCount = prev.filter((s) =>
          isReferenceTitle(s.title),
        ).length;
        if (referenceCount <= 1) {
          toast.error(
            'Template must contain one Reference or References section.',
          );
          return prev;
        }
      }

      const updated = prev.filter((s) => s._id !== id);
      return reorderSectionsWithReferenceLast(updated);
    });
  };

  React.useEffect(() => {
    if (!pendingScrollSectionId) return;
    const targetCard = sectionCardRefs.current[pendingScrollSectionId];
    const formNode = formRef.current;
    if (!targetCard || !formNode) return;

    requestAnimationFrame(() => {
      const offset = targetCard.offsetTop - formNode.offsetTop - 12;
      formNode.scrollTo({ top: Math.max(offset, 0), behavior: 'smooth' });
      const firstInput = targetCard.querySelector('input, textarea');
      if (firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
      setPendingScrollSectionId(null);
    });
  }, [sections, pendingScrollSectionId]);

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
      return reorderSectionsWithReferenceLast(updated);
    });
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sections.some((s) => !s.title.trim() || !s.sectionRule.trim())) {
      toast.error('Section title and rule are required.');
      return;
    }

    const referenceCount = sections.filter((s) =>
      isReferenceTitle(s.title),
    ).length;
    if (referenceCount !== 1) {
      toast.error(
        'Template must contain exactly one Reference or References section.',
      );
      return;
    }

    const lastSection = sections[sections.length - 1];
    if (!lastSection || !isReferenceTitle(lastSection.title)) {
      toast.error('Reference or References section must be the last section.');
      return;
    }

    mutation.mutate({
      id: template.id,
      data: {
        description: description.trim(),
        sections: sections.map(({ _id, ...s }) => s),
      },
    });
  };

  const referenceCount = sections.filter((s) =>
    isReferenceTitle(s.title),
  ).length;
  const hasExactlyOneReference = referenceCount === 1;
  const hasReferenceAtLast =
    sections.length > 0 &&
    isReferenceTitle(sections[sections.length - 1]?.title ?? '');
  const hasInvalidSectionContent = sections.some(
    (s) => !s.title.trim() || !s.sectionRule.trim(),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction" size="action">
          EDIT
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update &quot;{template.code}&quot;
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          id="update-pt-form"
          onSubmit={handleSubmit}
          ref={formRef}
          className="scrollbar-dialog flex-1 space-y-5 overflow-y-auto px-6 py-4"
        >
          {/* Read-only info */}
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground text-xs">Code</p>
            <p className="mt-0.5 font-medium">{template.code}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="upt-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="upt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  ref={(node) => {
                    sectionCardRefs.current[section._id] = node;
                  }}
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
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            CANCEL
          </Button>
          <Button
            type="submit"
            form="update-pt-form"
            disabled={
              mutation.isPending ||
              hasInvalidSectionContent ||
              !hasExactlyOneReference ||
              !hasReferenceAtLast
            }
            variant="darkRed"
          >
            {mutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
