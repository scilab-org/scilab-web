import { useState, useEffect } from 'react';
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

import { useUpdateDataset } from '../api/update-dataset';
import { Dataset } from '../types';

type UpdateDatasetProps = {
  projectId: string;
  dataset: Dataset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdateDataset = ({
  projectId,
  dataset,
  open,
  onOpenChange,
}: UpdateDatasetProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateDataset({
    projectId,
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    },
  });

  useEffect(() => {
    if (dataset && open) {
      setFormData({
        name: dataset.name,
        description: dataset.description,
        file: null,
      });
    }
  }, [dataset, open]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && dataset) {
      updateMutation.mutate({
        datasetId: dataset.id,
        name: formData.name,
        description: formData.description,
        file: formData.file || undefined,
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
      <SheetContent className="overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Update Dataset</SheetTitle>
          <SheetDescription>
            Update the dataset information. Leave file empty to keep the
            existing file.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          id="update-dataset-form"
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="update-dataset-name"
                className="text-foreground text-sm font-medium"
              >
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="update-dataset-name"
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
                htmlFor="update-dataset-description"
                className="text-foreground text-sm font-medium"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="update-dataset-description"
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
                htmlFor="update-dataset-file"
                className="text-foreground text-sm font-medium"
              >
                File (Optional - Leave empty to keep existing)
              </label>
              <Input
                id="update-dataset-file"
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.json"
                className="cursor-pointer"
              />
              {formData.file && (
                <p className="text-muted-foreground text-xs">
                  New file: {formData.file.name}
                </p>
              )}
              {dataset && !formData.file && (
                <p className="text-muted-foreground text-xs">
                  Current file: {dataset.filePath.split('/').pop()}
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
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="update-dataset-form"
            disabled={updateMutation.isPending}
            className="min-w-25"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Dataset'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
