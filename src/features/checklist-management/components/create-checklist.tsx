import * as React from 'react';
import { toast } from 'sonner';

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

import { FIELD_LABEL_CLASS } from '../constants';
import { useCreateCheckList } from '../api/create-checklist';
import { useCheckLists } from '../api/get-checklists';
import {
  CheckListItemsEditor,
  CheckListItemFormRow,
  createCheckListItemFormRow,
  isCheckListItemFormRowValid,
  normalizeCheckListItemFormRows,
} from './checklist-items-editor';
import { SectionInput } from './section-input';

const initialFormData = {
  section: '',
};

export const CreateCheckList = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [items, setItems] = React.useState<CheckListItemFormRow[]>(() => [
    createCheckListItemFormRow(),
  ]);

  const allCheckListsQuery = useCheckLists({
    params: { PageSize: 1000 },
    queryConfig: { enabled: open },
  });

  const usedSections = React.useMemo(
    () =>
      (allCheckListsQuery.data?.result?.items ?? []).map((cl) =>
        cl.section.trim(),
      ),
    [allCheckListsQuery.data],
  );

  const isSectionTaken = usedSections.some(
    (s) => s.toLowerCase() === formData.section.trim().toLowerCase(),
  );

  const createCheckListMutation = useCreateCheckList({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        setItems([createCheckListItemFormRow()]);
        toast.success('Check list created successfully');
      },
      onError: () => {
        toast.error('Failed to create check list');
      },
    },
  });

  const isFormValid =
    formData.section.trim().length > 0 &&
    !isSectionTaken &&
    items.length > 0 &&
    items.every(isCheckListItemFormRowValid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCheckListMutation.mutate({
      section: formData.section.trim(),
      items: normalizeCheckListItemFormRows(items),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setFormData(initialFormData);
          setItems([createCheckListItemFormRow()]);
        }
      }}
    >
      <DialogTrigger asChild>
        <CreateButton className="uppercase">CREATE CHECK LIST</CreateButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Create New Check List</DialogTitle>
            <DialogDescription>
              Fill in the section and checklist items to create a new check
              list.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          id="create-checklist-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-5 overflow-y-auto px-6 py-4"
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
              disabledSections={usedSections}
            />
            {isSectionTaken && (
              <p className="text-destructive text-sm">
                A check list for this section already exists.
              </p>
            )}
          </div>

          <CheckListItemsEditor rows={items} onChange={setItems} />
        </form>

        <div className="shrink-0 border-t px-6 py-4">
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
