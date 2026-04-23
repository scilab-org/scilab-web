import * as React from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';

import { useGapTypes } from '@/features/gap-type-management/api/get-gap-types';
import { useUpdateWritingPaper } from '../api/update-writing-paper';
import { WritingPaperDto } from '../types';

const fieldClassName =
  'border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full max-w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

type Props = {
  paperId: string;
  paper: WritingPaperDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdateWritingPaper = ({
  paperId,
  paper,
  open,
  onOpenChange,
}: Props) => {
  const [form, setForm] = React.useState({
    context: '',
    abstract: '',
    researchGap: '',
    researchAim: '',
    gapTypeIds: [] as string[],
    mainContribution: '',
    conferenceJournalStartAt: '',
    conferenceJournalEndAt: '',
  });
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const boxRef = React.useRef<HTMLDivElement | null>(null);

  const gapTypesQuery = useGapTypes({
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: open },
  });
  const gapTypes = gapTypesQuery.data?.result?.items ?? [];
  const selectedGapTypes = gapTypes.filter((g) =>
    form.gapTypeIds.includes(g.id),
  );
  const filteredGapTypes = gapTypes.filter(
    (g) =>
      !form.gapTypeIds.includes(g.id) &&
      g.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const updateMutation = useUpdateWritingPaper({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Paper updated successfully');
        onOpenChange(false);
      },
      onError: () => toast.error('Failed to update paper'),
    },
  });

  React.useEffect(() => {
    if (open && paper) {
      setForm({
        context: paper.context ?? '',
        abstract: paper.abstract ?? '',
        researchGap: paper.researchGap ?? '',
        researchAim: paper.researchAim ?? '',
        gapTypeIds: paper.gapTypes?.map((gt) => gt.id) ?? [],
        mainContribution: paper.mainContribution ?? '',
        conferenceJournalStartAt: toDateTimeLocalValue(
          paper.conferenceJournalStartAt,
        ),
        conferenceJournalEndAt: toDateTimeLocalValue(
          paper.conferenceJournalEndAt,
        ),
      });
      setSearch('');
      setIsOpen(false);
    }
  }, [open, paper]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        boxRef.current &&
        !boxRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      paperId,
      data: { ...form, gapTypeIds: form.gapTypeIds },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scrollbar-dialog bg-background flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Paper</DialogTitle>
          <DialogDescription>Update the paper details below.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="scrollbar-dialog min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {[
            'context',
            'abstract',
            'researchGap',
            'researchAim',
            'mainContribution',
          ].map((key) => (
            <div className="space-y-1.5" key={key}>
              <label
                htmlFor={`update-writing-paper-${key}`}
                className="text-sm font-medium capitalize"
              >
                {key.replace(/([A-Z])/g, ' $1')}{' '}
                <span className="text-destructive">*</span>
              </label>
              <textarea
                id={`update-writing-paper-${key}`}
                className={fieldClassName}
                value={(form as any)[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                required
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Gap Types <span className="text-destructive">*</span>
            </p>
            <div ref={boxRef} className="relative">
              <div
                className={cn(
                  'border-input text-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]',
                )}
                onClick={() => inputRef.current?.focus()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    inputRef.current?.focus();
                  }
                }}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="update-writing-paper-gap-types-listbox"
                tabIndex={0}
              >
                {selectedGapTypes.map((g) => (
                  <Badge
                    key={g.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
                  >
                    {g.name}
                    <button
                      type="button"
                      className="text-white/80 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setForm((prev) => ({
                          ...prev,
                          gapTypeIds: prev.gapTypeIds.filter(
                            (id) => id !== g.id,
                          ),
                        }));
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="update-writing-paper-gap-types-input"
                  ref={inputRef}
                  value={search}
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                  }}
                  placeholder={
                    selectedGapTypes.length
                      ? 'Add more gap types...'
                      : 'Search gap types...'
                  }
                  autoComplete="off"
                  className="flex h-5 min-w-24 flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0"
                />
              </div>
              {isOpen && (
                <div
                  id="update-writing-paper-gap-types-listbox"
                  className="bg-background absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-sm"
                >
                  {filteredGapTypes.length ? (
                    filteredGapTypes.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className="hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            gapTypeIds: [...prev.gapTypeIds, g.id],
                          }))
                        }
                      >
                        <span>{g.name}</span>
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="update-writing-paper-start"
                className="text-sm font-medium"
              >
                Conference / Journal Start
              </label>
              <Input
                id="update-writing-paper-start"
                type="datetime-local"
                value={form.conferenceJournalStartAt}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    conferenceJournalStartAt: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="update-writing-paper-end"
                className="text-sm font-medium"
              >
                Conference / Journal End
              </label>
              <Input
                id="update-writing-paper-end"
                type="datetime-local"
                value={form.conferenceJournalEndAt}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    conferenceJournalEndAt: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              CANCEL
            </Button>
            <Button type="submit" variant="darkRed">
              SAVE
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
