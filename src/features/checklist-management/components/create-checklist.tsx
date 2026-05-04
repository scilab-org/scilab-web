import * as React from 'react';
import { toast } from 'sonner';

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

import { FIELD_LABEL_CLASS } from '../constants';
import { useCreateCheckList } from '../api/create-checklist';
import { SectionInput } from './section-input';

const initialFormData = {
  section: '',
  ruleName: '',
  item: '',
  weight: '',
};

export const CreateCheckList = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const createCheckListMutation = useCreateCheckList({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        toast.success('Check list created successfully');
      },
      onError: () => {
        toast.error('Failed to create check list');
      },
    },
  });

  const isFormValid =
    formData.section.trim() &&
    formData.ruleName.trim() &&
    formData.item.trim() &&
    formData.weight !== '' &&
    !isNaN(Number(formData.weight)) &&
    Number(formData.weight) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCheckListMutation.mutate({
      section: formData.section.trim(),
      ruleName: formData.ruleName.trim(),
      item: formData.item.trim(),
      weight: Number(formData.weight),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setFormData(initialFormData);
      }}
    >
      <DialogTrigger asChild>
        <CreateButton className="uppercase">CREATE CHECK LIST</CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Check List</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new check list item.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-checklist-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="create-checklist-section"
              className={FIELD_LABEL_CLASS}
            >
              Section <span className="text-destructive">*</span>
            </label>
            <SectionInput
              id="create-checklist-section"
              value={formData.section}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, section: val }))
              }
              placeholder="Enter or select section"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="create-checklist-rulename"
              className={FIELD_LABEL_CLASS}
            >
              Rule Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-checklist-rulename"
              value={formData.ruleName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ruleName: e.target.value }))
              }
              placeholder="Enter rule name"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="create-checklist-item"
              className={FIELD_LABEL_CLASS}
            >
              Item <span className="text-destructive">*</span>
            </label>
            <textarea
              id="create-checklist-item"
              value={formData.item}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, item: e.target.value }))
              }
              placeholder="Enter item"
              required
              rows={4}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 font-sans text-sm shadow-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="create-checklist-weight"
              className={FIELD_LABEL_CLASS}
            >
              Weight <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-checklist-weight"
              type="number"
              value={formData.weight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || Number(val) > 0)
                  setFormData((prev) => ({ ...prev, weight: val }));
              }}
              placeholder="Enter weight"
              required
              min={0}
            />
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-checklist-form"
            disabled={createCheckListMutation.isPending || !isFormValid}
            variant="darkRed"
          >
            {createCheckListMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
