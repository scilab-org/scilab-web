import * as React from 'react';
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

import { FIELD_LABEL_CLASS } from '../constants';
import { useUpdateCheckList } from '../api/update-checklist';
import { CheckListDto } from '../types';
import { SectionInput } from './section-input';

interface UpdateCheckListProps {
  checkListId: string;
  checkList: CheckListDto;
}

const initialFormData = {
  section: '',
  ruleName: '',
  item: '',
  weight: '',
};

export const UpdateCheckList = ({
  checkListId,
  checkList,
}: UpdateCheckListProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);

  const updateCheckListMutation = useUpdateCheckList({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        toast.success('Check list updated successfully');
      },
      onError: () => {
        toast.error('Failed to update check list');
      },
    },
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        section: checkList.section || '',
        ruleName: checkList.ruleName || '',
        item: checkList.item || '',
        weight: String(checkList.weight ?? ''),
      });
    }
  }, [open, checkList]);

  const isFormValid =
    formData.section.trim() &&
    formData.ruleName.trim() &&
    formData.item.trim() &&
    formData.weight !== '' &&
    !isNaN(Number(formData.weight)) &&
    Number(formData.weight) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCheckListMutation.mutate({
      checkListId,
      data: {
        section: formData.section.trim(),
        ruleName: formData.ruleName.trim(),
        item: formData.item.trim(),
        weight: Number(formData.weight),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineAction">EDIT</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Check List</DialogTitle>
          <DialogDescription>
            Update information for this check list item.
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-checklist-form"
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="update-checklist-section"
              className={FIELD_LABEL_CLASS}
            >
              Section <span className="text-destructive">*</span>
            </label>
            <SectionInput
              id="update-checklist-section"
              value={formData.section}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, section: val }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-checklist-rulename"
              className={FIELD_LABEL_CLASS}
            >
              Rule Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-checklist-rulename"
              value={formData.ruleName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ruleName: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-checklist-item"
              className={FIELD_LABEL_CLASS}
            >
              Item <span className="text-destructive">*</span>
            </label>
            <textarea
              id="update-checklist-item"
              value={formData.item}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, item: e.target.value }))
              }
              required
              rows={4}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 font-sans text-sm shadow-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="update-checklist-weight"
              className={FIELD_LABEL_CLASS}
            >
              Weight <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-checklist-weight"
              type="number"
              value={formData.weight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || Number(val) > 0)
                  setFormData((prev) => ({ ...prev, weight: val }));
              }}
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
            form="update-checklist-form"
            disabled={updateCheckListMutation.isPending || !isFormValid}
            variant="darkRed"
          >
            {updateCheckListMutation.isPending ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
