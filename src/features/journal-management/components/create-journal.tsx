import * as React from 'react';
import { Check, X } from 'lucide-react';
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
import { usePaperTemplates } from '@/features/paper-template-management/api/get-paper-templates';
import { useCreateJournal } from '../api/create-journal';

const JOURNAL_TYPES = [
  { label: 'Journal', value: 1 },
  { label: 'Conference', value: 2 },
];

const initialFormData = {
  name: '',
  templateIds: [] as string[],
  issn: '',
  ranking: '',
  url: '',
  style: '',
  type: 1 as number,
  texFile: null as File | null,
  pdfFile: null as File | null,
};

export const CreateJournal = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [templateSearch, setTemplateSearch] = React.useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = React.useState(false);
  const templateInputRef = React.useRef<HTMLInputElement>(null);

  const templatesQuery = usePaperTemplates({
    params: { PageSize: 1000 },
    queryConfig: { enabled: open },
  });

  const createJournalMutation = useCreateJournal({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        setTemplateSearch('');
        toast.success('Journal created successfully');
      },
      onError: () => {
        toast.error('Failed to create journal');
      },
    },
  });

  const handleTemplateToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      templateIds: prev.templateIds.includes(id)
        ? prev.templateIds.filter((t) => t !== id)
        : [...prev.templateIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      formData.templateIds.length === 0 ||
      !formData.ranking.trim() ||
      !formData.url.trim() ||
      !formData.style.trim()
    )
      return;

    createJournalMutation.mutate({
      name: formData.name.trim(),
      templateIds: formData.templateIds,
      issn: formData.issn.trim(),
      ranking: formData.ranking.trim(),
      url: formData.url.trim(),
      style: formData.style.trim(),
      type: formData.type,
      texFile: formData.texFile,
      pdfFile: formData.pdfFile,
    });
  };

  const templates = templatesQuery.data?.result?.items ?? [];
  const filteredTemplates = templates.filter(
    (t) =>
      t.code.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.description ?? '')
        .toLowerCase()
        .includes(templateSearch.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTemplateSearch('');
      }}
    >
      <DialogTrigger asChild>
        <CreateButton size="sm" className="uppercase">
          ADD JOURNAL / CONFERENCE
        </CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Journal / Conference</DialogTitle>
          <DialogDescription>
            Fill in the journal details and upload files.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-journal-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="cj-name" className="text-sm font-medium">
              Journal Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter journal name"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label htmlFor="cj-type" className="text-sm font-medium">
              Type <span className="text-destructive">*</span>
            </label>
            <select
              id="cj-type"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: Number(e.target.value),
                }))
              }
              required
              className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            >
              {JOURNAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* ISSN */}
          <div className="space-y-1.5">
            <label htmlFor="cj-issn" className="text-sm font-medium">
              ISSN <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-issn"
              value={formData.issn}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issn: e.target.value }))
              }
              placeholder="e.g. 00079235, 15424863"
            />
          </div>

          {/* Templates (token input) */}
          <div className="space-y-1.5">
            <label htmlFor="cj-template-input" className="text-sm font-medium">
              Templates <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-h-10 cursor-text flex-wrap gap-1.5 rounded-md border p-1.5 focus-within:ring-[3px]">
                {formData.templateIds.map((id) => {
                  const tpl = templates.find((t) => t.id === id);
                  return tpl ? (
                    <span
                      key={id}
                      className="bg-muted flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-sm font-medium"
                    >
                      {tpl.code}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateToggle(id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ) : null;
                })}
                <input
                  ref={templateInputRef}
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  onFocus={() => setShowTemplateDropdown(true)}
                  id="cj-template-input"
                  onBlur={() =>
                    setTimeout(() => setShowTemplateDropdown(false), 150)
                  }
                  placeholder={
                    formData.templateIds.length === 0
                      ? 'Search and select at least one template.'
                      : ''
                  }
                  className="text-foreground placeholder:text-muted-foreground min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
                />
              </div>
              {showTemplateDropdown && (
                <div className="border-input bg-background absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md">
                  {templatesQuery.isLoading ? (
                    <p className="text-muted-foreground px-3 py-2 text-sm">
                      Loading...
                    </p>
                  ) : filteredTemplates.length === 0 ? (
                    <p className="text-muted-foreground px-3 py-2 text-sm">
                      No templates found.
                    </p>
                  ) : (
                    filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onMouseDown={() => {
                          handleTemplateToggle(t.id);
                          setTemplateSearch('');
                        }}
                        className={`hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                          formData.templateIds.includes(t.id)
                            ? 'bg-muted/50'
                            : ''
                        }`}
                      >
                        <span className="font-mono font-medium">{t.code}</span>
                        {t.description && (
                          <span className="text-muted-foreground truncate text-xs">
                            {t.description}
                          </span>
                        )}
                        {formData.templateIds.includes(t.id) && (
                          <Check className="text-primary ml-auto size-3.5 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cj-ranking" className="text-sm font-medium">
              Ranking <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-ranking"
              value={formData.ranking}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ranking: e.target.value }))
              }
              placeholder="Enter journal ranking"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cj-url" className="text-sm font-medium">
              URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="cj-url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://example.com/journal"
              required
            />
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label htmlFor="cj-style" className="text-sm font-medium">
              Style <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cj-style"
              value={formData.style}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, style: e.target.value }))
              }
              placeholder="Enter Journal / Conference Style"
              required
              className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-40 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* TeX File */}
          <div className="space-y-1.5">
            <label htmlFor="cj-texFile" className="text-sm font-medium">
              TeX File
            </label>
            <input
              id="cj-texFile"
              type="file"
              accept=".tex"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  texFile: e.target.files?.[0] ?? null,
                }))
              }
              className="border-input dark:bg-input/30 flex h-10 w-full cursor-pointer rounded-md border bg-transparent px-3 py-2 text-sm file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>

          {/* PDF File */}
          <div className="space-y-1.5">
            <label htmlFor="cj-pdfFile" className="text-sm font-medium">
              PDF File
            </label>
            <input
              id="cj-pdfFile"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pdfFile: e.target.files?.[0] ?? null,
                }))
              }
              className="border-input dark:bg-input/30 flex h-10 w-full cursor-pointer rounded-md border bg-transparent px-3 py-2 text-sm file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="uppercase"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-journal-form"
            disabled={
              createJournalMutation.isPending ||
              !formData.name.trim() ||
              formData.templateIds.length === 0 ||
              !formData.ranking.trim() ||
              !formData.url.trim() ||
              !formData.style.trim()
            }
            variant="darkRed"
            className="uppercase"
          >
            {createJournalMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
