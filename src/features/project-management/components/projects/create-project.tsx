import { useState } from 'react';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CreateButton } from '@/components/ui/create-button';
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { useCreateProject } from '../../api/projects/create-project';
import { CreateProjectDto } from '../../types';
import { FIELD_LABEL_CLASS } from '../../constants';

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
    domain: '',
    keypoint: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      domain: '',
      keypoint: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

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
    if (validateForm()) {
      const payload = {
        ...formData,
        status: Number(formData.status),
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : new Date().toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
      };
      createMutation.mutate(payload);
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
              <label htmlFor="project-domain" className={FIELD_LABEL_CLASS}>
                Domain
              </label>
              <Input
                id="project-domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="Enter project domain"
              />
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
