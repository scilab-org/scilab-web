import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload a new dataset for this project. All fields are required.
          </DialogDescription>
        </DialogHeader>

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
              {formData.file ? (
                <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                    <Upload className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {formData.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(formData.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, file: null }));
                      if (errors.file) {
                        setErrors((prev) => ({ ...prev, file: '' }));
                      }
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="dataset-file"
                  className="border-input hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors"
                >
                  <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                    <Upload className="size-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Click to upload dataset
                    </p>
                    <p className="text-muted-foreground text-xs">
                      CSV, Excel, or JSON files
                    </p>
                  </div>
                  <input
                    id="dataset-file"
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
              {errors.file && (
                <p className="text-destructive text-sm">{errors.file}</p>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={createMutation.isPending}
              className="uppercase"
            >
              CANCEL
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-dataset-form"
            variant="darkRed"
            disabled={createMutation.isPending}
            className="min-w-25 uppercase"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                UPLOADING...
              </>
            ) : (
              'UPLOAD'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
