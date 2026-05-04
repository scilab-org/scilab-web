import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { useCheckList } from '../api/get-checklist';
import { useCheckLists } from '../api/get-checklists';
import { useUpdateCheckList } from '../api/update-checklist';
import { CheckListDto } from '../types';
import {
  CheckListItemsEditor,
  CheckListItemFormRow,
  isCheckListItemFormRowValid,
  mapCheckListItemToFormRow,
  normalizeCheckListItemFormRows,
} from './checklist-items-editor';
import { SectionInput } from './section-input';

interface UpdateCheckListProps {
  checkListId: string;
  checkList: CheckListDto;
}

const initialFormData = {
  section: '',
};

export const UpdateCheckList = ({
  checkListId,
  checkList,
}: UpdateCheckListProps) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [items, setItems] = React.useState<CheckListItemFormRow[]>([]);

  const checkListDetailQuery = useCheckList({
    checkListId,
    queryConfig: {
      enabled: open,
    },
  });

  const allCheckListsQuery = useCheckLists({
    params: { PageSize: 1000 },
    queryConfig: { enabled: open },
  });

  const resolvedCheckList =
    checkListDetailQuery.data?.result.checkList ?? checkList;

  const usedSections = React.useMemo(
    () =>
      (allCheckListsQuery.data?.result?.items ?? [])
        .filter((cl) => cl.id !== checkListId)
        .map((cl) => cl.section.trim()),
    [allCheckListsQuery.data, checkListId],
  );

  const isSectionTaken = usedSections.some(
    (s) => s.toLowerCase() === formData.section.trim().toLowerCase(),
  );

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
        section: resolvedCheckList.section || '',
      });
      setItems(
        resolvedCheckList.items.length > 0
          ? resolvedCheckList.items.map(mapCheckListItemToFormRow)
          : [],
      );
    }
  }, [open, resolvedCheckList]);

  const isFormValid =
    formData.section.trim().length > 0 &&
    !isSectionTaken &&
    (items.length === 0 || items.every(isCheckListItemFormRowValid));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedItems = normalizeCheckListItemFormRows(items);

    updateCheckListMutation.mutate({
      checkListId,
      data: {
        section: formData.section.trim(),
        ...(normalizedItems.length > 0 ? { items: normalizedItems } : {}),
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setFormData(initialFormData);
          setItems([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outlineAction">EDIT</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Check List</DialogTitle>
            <DialogDescription>
              Update the section and checklist items. Items can be left empty.
            </DialogDescription>
          </DialogHeader>
        </div>
        {checkListDetailQuery.isFetching && (
          <p className="text-muted-foreground shrink-0 px-6 text-sm">
            Loading latest checklist detail...
          </p>
        )}
        <form
          id="update-checklist-form"
          onSubmit={handleSubmit}
          className="scrollbar-dialog flex-1 space-y-5 overflow-y-auto px-6 py-4"
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
              disabledSections={usedSections}
            />
            {isSectionTaken && (
              <p className="text-destructive text-sm">
                A check list for this section already exists.
              </p>
            )}
          </div>

          <CheckListItemsEditor rows={items} onChange={setItems} optional />
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
              form="update-checklist-form"
              disabled={updateCheckListMutation.isPending || !isFormValid}
              variant="darkRed"
            >
              {updateCheckListMutation.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
