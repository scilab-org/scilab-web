import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
import { useUpdateProject } from '../../api/projects/update-project';
import { Project, UpdateProjectDto } from '../../types';

type UpdateProjectProps = {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    domain: '',
    keypoint: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateProject({
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
      },
    },
  });

  // Update form data when project changes
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
        domain: project.domain || '',
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
                Domain
              </label>
              <Input
                id="update-domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="Enter project domain"
              />
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
