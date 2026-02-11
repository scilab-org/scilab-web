import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useCreateProject } from '../api/create-project';
import { CreateProjectDto } from '../types';

export const CreateProject = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectDto>({
    name: '',
    code: '',
    description: '',
    status: 1,
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateProject({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        resetForm();
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
          : new Date(
              new Date().setMonth(new Date().getMonth() + 1),
            ).toISOString(),
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="size-4" />
          Create Project
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-150">
        <SheetHeader>
          <SheetTitle>Create New Project</SheetTitle>
          <SheetDescription>
            Fill in the details to create a new project. Fields marked with *
            are required.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          id="create-project-form"
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="project-name"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Name *
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
                <label
                  htmlFor="project-code"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Code *
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
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Description *
              </label>
              <textarea
                id="project-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={3}
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-status"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Status
              </label>
              <select
                id="project-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                <option value="1">Draft</option>
                <option value="2">Active</option>
                <option value="3">Completed</option>
                <option value="4">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-startDate"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
              <label
                htmlFor="project-endDate"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                End Date
              </label>
              <Input
                id="project-endDate"
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
              {errors.endDate && (
                <p className="text-destructive text-xs">{errors.endDate}</p>
              )}
            </div>
          </div>
        </form>

        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="min-w-25"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="create-project-form"
            disabled={createMutation.isPending}
            className="min-w-25"
          >
            {createMutation.isPending ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
