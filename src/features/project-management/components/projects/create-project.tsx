import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateButton } from '@/components/ui/create-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { useDomains } from '@/features/domain-management/api/get-domains';
import { DomainDto } from '@/features/domain-management/types';
import { cn } from '@/utils/cn';
import { useCreateProject } from '../../api/projects/create-project';
import { CreateProjectDto } from '../../types';
import { FIELD_LABEL_CLASS } from '../../constants';

type DomainMultiSelectProps = {
  selectedIds: string[];
  options: DomainDto[];
  loading?: boolean;
  onChange: (ids: string[]) => void;
};

const DomainMultiSelect = ({
  selectedIds,
  options,
  loading,
  onChange,
}: DomainMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDomains = useMemo(
    () => options.filter((domain) => selectedIds.includes(domain.id)),
    [options, selectedIds],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = options.filter(
      (domain) => !selectedIds.includes(domain.id),
    );
    if (!q) return available;
    return available.filter((domain) => domain.name.toLowerCase().includes(q));
  }, [options, query, selectedIds]);

  useEffect(() => {
    setActiveIndex((prev) =>
      Math.min(prev, Math.max(filteredOptions.length - 1, 0)),
    );
  }, [filteredOptions.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const addDomain = (domainId: string) => {
    if (selectedIds.includes(domainId)) return;
    onChange([...selectedIds, domainId]);
  };

  const removeDomain = (domainId: string) => {
    onChange(selectedIds.filter((id) => id !== domainId));
  };

  const highlightMatch = (name: string) => {
    const q = query.trim();
    if (!q) return name;
    const lower = name.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return name;

    return (
      <>
        {name.slice(0, idx)}
        <mark className="bg-muted px-0 text-inherit">
          {name.slice(idx, idx + q.length)}
        </mark>
        {name.slice(idx + q.length)}
      </>
    );
  };

  const selectActiveOption = () => {
    const active = filteredOptions[activeIndex];
    if (active) {
      addDomain(active.id);
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="project-domains-listbox"
        className={cn(
          'border-input text-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-9 w-full flex-wrap items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] md:text-sm',
        )}
        onClick={() => inputRef.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {selectedDomains.map((domain) => (
          <Badge
            key={domain.id}
            variant="secondary"
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
          >
            {domain.name}
            <button
              type="button"
              className="text-white/80 hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeDomain(domain.id);
              }}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((prev) =>
                filteredOptions.length === 0
                  ? 0
                  : (prev + 1) % filteredOptions.length,
              );
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((prev) =>
                filteredOptions.length === 0
                  ? 0
                  : (prev - 1 + filteredOptions.length) %
                    filteredOptions.length,
              );
            }
            if (e.key === 'Enter') {
              if (open && filteredOptions.length > 0) {
                e.preventDefault();
                selectActiveOption();
              }
            }
            if (e.key === 'Escape') {
              setOpen(false);
            }
            if (e.key === 'Backspace' && !query && selectedIds.length > 0) {
              onChange(selectedIds.slice(0, -1));
            }
          }}
          placeholder={
            selectedDomains.length > 0 ? '' : 'Type to add more domains...'
          }
          className="placeholder:text-muted-foreground/50 flex h-5 min-w-24 flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0"
        />
      </div>

      {open && (
        <div
          id="project-domains-listbox"
          role="listbox"
          className="border-input bg-background text-foreground absolute top-full z-50 mt-0 w-full overflow-hidden rounded-md border shadow-md"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                Loading domains...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                {query.trim()
                  ? 'No matching domains.'
                  : 'No more domains available.'}
              </div>
            ) : (
              filteredOptions.map((domain, index) => {
                const isActive = index === activeIndex;
                const isSelected = selectedIds.includes(domain.id);

                return (
                  <button
                    key={domain.id}
                    type="button"
                    role="option"
                    aria-selected={isActive || isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      addDomain(domain.id);
                      setQuery('');
                      setActiveIndex(0);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors outline-none',
                      isActive && 'bg-accent text-accent-foreground',
                      isSelected && !isActive && 'bg-muted/70',
                    )}
                  >
                    <span className="truncate">
                      {highlightMatch(domain.name)}
                    </span>
                    <Check
                      className={cn(
                        'size-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CreateProject = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectDto>({
    name: '',
    code: '',
    description: '',
    status: 1,
    startDate: '',
    endDate: '',
    context: '',
    domainIds: [],
    keypoint: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const domainsQuery = useDomains({
    params: {
      PageNumber: 1,
      PageSize: 50,
    },
  });

  const domainOptions = useMemo(
    () => domainsQuery.data?.result?.items ?? [],
    [domainsQuery.data?.result?.items],
  );

  const createMutation = useCreateProject({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        const errorsData = error?.response?.data?.errors;
        if (errorsData && errorsData.length > 0) {
          const codeExistsError = errorsData.find(
            (e: any) => e.errorMessage === 'PROJECT_CODE_ALREADY_EXISTS',
          );
          if (codeExistsError) {
            setErrors((prev) => ({
              ...prev,
              code: 'This project code already exists.',
            }));
            return;
          }
        }
        toast.error('Failed to create project. Please try again.');
      },
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 1,
      startDate: '',
      endDate: '',
      context: '',
      domainIds: [],
      keypoint: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (formData.domainIds.length === 0)
      newErrors.domainIds = 'Select at least one domain';

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createMutation.mutate({
      ...formData,
      status: Number(formData.status),
      startDate: formData.startDate
        ? new Date(formData.startDate).toISOString()
        : new Date().toISOString(),
      endDate: formData.endDate
        ? new Date(formData.endDate).toISOString()
        : null,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <CreateButton className="uppercase">CREATE PROJECT</CreateButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new project. Fields marked with *
              are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          id="create-project-form"
          className="scrollbar-dialog flex-1 space-y-5 overflow-y-auto px-6 py-4"
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="project-name" className={FIELD_LABEL_CLASS}>
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="project-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                />
                {errors.name && (
                  <p className="text-destructive text-xs">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="project-code" className={FIELD_LABEL_CLASS}>
                  Code <span className="text-destructive">*</span>
                </label>
                <Input
                  id="project-code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Enter project code"
                />
                {errors.code && (
                  <p className="text-destructive text-xs">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-description"
                className={FIELD_LABEL_CLASS}
              >
                Description <span className="text-destructive">*</span>
              </label>
              <AutoResizeTextarea
                id="project-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={3}
                className="border-input text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="project-status" className={FIELD_LABEL_CLASS}>
                Status
              </label>
              <Select
                value={String(formData.status)}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, status: Number(val) }))
                }
              >
                <SelectTrigger className="w-full bg-transparent shadow-xs">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Draft</SelectItem>
                  <SelectItem value="2">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="project-startDate"
                  className={FIELD_LABEL_CLASS}
                >
                  Start Date
                </label>
                <Input
                  id="project-startDate"
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="project-endDate" className={FIELD_LABEL_CLASS}>
                  End Date
                </label>
                <Input
                  id="project-endDate"
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate ?? ''}
                  onChange={handleChange}
                />
                {errors.endDate && (
                  <p className="text-destructive text-xs">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="project-domainIds" className={FIELD_LABEL_CLASS}>
                Domains <span className="text-destructive">*</span>
              </label>
              <DomainMultiSelect
                selectedIds={formData.domainIds}
                onChange={(domainIds) =>
                  setFormData((prev) => ({ ...prev, domainIds }))
                }
                options={domainOptions}
                loading={domainsQuery.isLoading}
              />
              {errors.domainIds && (
                <p className="text-destructive text-xs">{errors.domainIds}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="project-context" className={FIELD_LABEL_CLASS}>
                Context
              </label>
              <AutoResizeTextarea
                id="project-context"
                name="context"
                value={formData.context}
                onChange={handleChange}
                placeholder="Enter project context"
                rows={3}
                className="border-input text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="project-keypoint" className={FIELD_LABEL_CLASS}>
                Keypoint
              </label>
              <AutoResizeTextarea
                id="project-keypoint"
                name="keypoint"
                value={formData.keypoint}
                onChange={handleChange}
                placeholder="Enter project keypoint"
                rows={2}
                className="border-input text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
            </div>
          </div>
        </form>

        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="uppercase"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="darkRed"
              form="create-project-form"
              disabled={createMutation.isPending}
              className="uppercase"
            >
              {createMutation.isPending ? (
                <Loader className="animate-spin" />
              ) : (
                'SAVE'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
