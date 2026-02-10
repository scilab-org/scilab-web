import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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
} from '@/components/ui/sheet';

import { useCreateDataset } from '../api/create-dataset';

type CreateDatasetProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateDataset = ({
  projectId,
  open,
  onOpenChange,
}: CreateDatasetProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateDataset({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      file: null,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.file) newErrors.file = 'File is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && formData.file) {
      createMutation.mutate({
        projectId,
        name: formData.name,
        description: formData.description,
        file: formData.file,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      file,
    }));
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-150">
        <SheetHeader>
          <SheetTitle>Add Dataset</SheetTitle>
          <SheetDescription>
            Upload a new dataset for this project. All fields are required.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          id="create-dataset-form"
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="dataset-name"
                className="text-foreground text-sm font-medium"
              >
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="dataset-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., File Salary"
              />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="dataset-description"
                className="text-foreground text-sm font-medium"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="dataset-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter dataset description"
                rows={3}
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="dataset-file"
                className="text-foreground text-sm font-medium"
              >
                File <span className="text-destructive">*</span>
              </label>
              <Input
                id="dataset-file"
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.json"
                className="cursor-pointer"
              />
              {formData.file && (
                <p className="text-muted-foreground text-xs">
                  Selected: {formData.file.name}
                </p>
              )}
              {errors.file && (
                <p className="text-destructive text-sm">{errors.file}</p>
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="create-dataset-form"
            disabled={createMutation.isPending}
            className="min-w-25"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Add Dataset'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
