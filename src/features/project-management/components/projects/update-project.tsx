import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useUpdateProject } from '../../api/projects/update-project';
import { Project, UpdateProjectDto } from '../../types';

type UpdateProjectProps = {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
        aria-controls="update-project-domains-listbox"
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
          id="update-project-domains-listbox"
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
                    <span className="truncate">{domain.name}</span>
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

export const UpdateProject = ({
  project,
  open,
  onOpenChange,
}: UpdateProjectProps) => {
  const [formData, setFormData] = useState<UpdateProjectDto>({
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

  const updateMutation = useUpdateProject({
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to update project. Please try again.');
      },
    },
  });

  useEffect(() => {
    if (project && open) {
      setFormData({
        name: project.name,
        code: project.code,
        description: project.description,
        status: project.status,
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().slice(0, 16)
          : '',
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().slice(0, 16)
          : '',
        context: project.context || '',
        domainIds: project.domains?.map((domain) => domain.id) ?? [],
        keypoint: project.keypoint || '',
      });
    }
  }, [project, open]);

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm() && project) {
      const payload = {
        ...formData,
        status: Number(formData.status),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
      };
      updateMutation.mutate({
        projectId: project.id,
        data: payload,
      });
    }
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Edit the project details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          id="update-project-form"
          className="scrollbar-dialog flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="update-name"
                  className="text-foreground text-sm font-medium"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="update-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Project name"
                />
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="update-code"
                  className="text-foreground text-sm font-medium"
                >
                  Code <span className="text-destructive">*</span>
                </label>
                <Input
                  id="update-code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Project code"
                />
                {errors.code && (
                  <p className="text-destructive text-sm">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-description"
                className="text-foreground text-sm font-medium"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <AutoResizeTextarea
                id="update-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={3}
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-status"
                className="text-foreground text-sm font-medium"
              >
                Status <span className="text-destructive">*</span>
              </label>
              <Select
                value={String(formData.status)}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, status: Number(val) }))
                }
                disabled={project?.status === 4}
              >
                <SelectTrigger className="bg-card w-full shadow-xs">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {project?.status === 4 ? (
                    <SelectItem value="4">Archived</SelectItem>
                  ) : project?.status === 3 ? (
                    <>
                      <SelectItem value="3">Completed</SelectItem>
                      <SelectItem value="4">Archived</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="1">Draft</SelectItem>
                      <SelectItem value="2">Active</SelectItem>
                      <SelectItem value="3">Completed</SelectItem>
                      <SelectItem value="4">Archived</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {project?.status === 4 && (
                <p className="text-muted-foreground text-xs">
                  Archived projects cannot change status
                </p>
              )}
              {project?.status === 3 && (
                <p className="text-muted-foreground text-xs">
                  Completed projects can only be archived
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-startDate"
                className="text-foreground text-sm font-medium"
              >
                Start Date
              </label>
              <Input
                id="update-startDate"
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-endDate"
                className="text-foreground text-sm font-medium"
              >
                End Date
              </label>
              <Input
                id="update-endDate"
                type="datetime-local"
                name="endDate"
                value={formData.endDate ?? ''}
                onChange={handleChange}
              />
              {errors.endDate && (
                <p className="text-destructive text-sm">{errors.endDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-domain"
                className="text-foreground text-sm font-medium"
              >
                Domain <span className="text-destructive">*</span>
              </label>
              <DomainMultiSelect
                selectedIds={formData.domainIds}
                onChange={(ids) => {
                  setFormData((prev) => ({ ...prev, domainIds: ids }));
                  if (errors.domainIds) {
                    setErrors((prev) => ({ ...prev, domainIds: '' }));
                  }
                }}
                options={domainOptions}
                loading={domainsQuery.isLoading}
              />
              {errors.domainIds && (
                <p className="text-destructive text-sm">{errors.domainIds}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-context"
                className="text-foreground text-sm font-medium"
              >
                Context
              </label>
              <AutoResizeTextarea
                id="update-context"
                name="context"
                value={formData.context}
                onChange={handleChange}
                placeholder="Enter project context"
                rows={3}
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="update-keypoint"
                className="text-foreground text-sm font-medium"
              >
                Keypoint
              </label>
              <AutoResizeTextarea
                id="update-keypoint"
                name="keypoint"
                value={formData.keypoint}
                onChange={handleChange}
                placeholder="Enter project keypoint"
                rows={2}
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-15 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
            </div>
          </div>
        </form>

        <div className="shrink-0 px-6 pt-2 pb-6">
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={updateMutation.isPending}
                className="uppercase"
              >
                CANCEL
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="update-project-form"
              variant="darkRed"
              disabled={updateMutation.isPending}
              className="uppercase"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  SAVING...
                </>
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
