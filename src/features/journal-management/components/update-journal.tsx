import * as React from 'react';
import { Trash2, Plus, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { BTN } from '@/lib/button-styles';
import { useUpdateJournal } from '../api/update-journal';
import { useJournal } from '../api/get-journal';
import { JournalDto, JournalStyle } from '../types';

type UpdateJournalProps = {
  journalId: string;
  journal: JournalDto;
};

export const UpdateJournal = ({ journalId, journal }: UpdateJournalProps) => {
  const [open, setOpen] = React.useState(false);
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = React.useState(false);
  const [styleDialogMode, setStyleDialogMode] = React.useState<'add' | 'edit'>(
    'add',
  );
  const [formData, setFormData] = React.useState({
    name: journal.name,
    styles: journal.styles || [],
  });
  const [editingStyle, setEditingStyle] = React.useState<JournalStyle>({
    name: '',
    description: '',
    rule: '',
  });
  // Load detail khi drawer mở
  const journalDetailQuery = useJournal({
    journalId,
    queryConfig: { enabled: open },
  });

  React.useEffect(() => {
    if (journalDetailQuery.data?.result?.journal && open) {
      setFormData({
        name: journalDetailQuery.data.result.journal.name,
        styles: journalDetailQuery.data.result.journal.styles || [],
      });
      setEditingIdx(null);
      setStyleDialogOpen(false);
      setEditingStyle({ name: '', description: '', rule: '' });
    }
  }, [journalDetailQuery.data, open]);

  const updateJournalMutation = useUpdateJournal({
    mutationConfig: {
      onSuccess: (response) => {
        if (response?.value) {
          setOpen(false);
          toast.success('Journal updated successfully');
          return;
        }

        toast.error(
          'Update did not apply. Please check your input and try again.',
        );
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        if (
          errorData?.errors?.[0]?.errorMessage === 'JOURNAL_NAME_ALREADY_EXISTS'
        ) {
          toast.error('Journal name already exists');
        } else {
          toast.error('Failed to update journal');
        }
      },
    },
  });

  const handleAddStyle = () => {
    if (!editingStyle.name.trim()) return;
    setFormData((prev) => ({
      ...prev,
      styles: [
        ...prev.styles,
        { ...editingStyle, name: editingStyle.name.trim() },
      ],
    }));
    setEditingIdx(null);
    setStyleDialogOpen(false);
    setEditingStyle({ name: '', description: '', rule: '' });
  };

  const handleRemoveStyle = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      styles: prev.styles.filter((_, i) => i !== index),
    }));
    if (editingIdx === index) {
      setEditingIdx(null);
      setStyleDialogOpen(false);
      setEditingStyle({ name: '', description: '', rule: '' });
    }
  };

  const handleEditStyle = (index: number) => {
    setEditingStyle(formData.styles[index]);
    setEditingIdx(index);
    setStyleDialogMode('edit');
    setStyleDialogOpen(true);
  };

  const handleOpenAddStyleDialog = () => {
    setEditingIdx(null);
    setStyleDialogMode('add');
    setEditingStyle({ name: '', description: '', rule: '' });
    setStyleDialogOpen(true);
  };

  const handleUpdateExistingStyle = () => {
    if (!editingStyle.name.trim() || editingIdx === null) return;
    setFormData((prev) => ({
      ...prev,
      styles: prev.styles.map((s, i) =>
        i === editingIdx
          ? { ...editingStyle, name: editingStyle.name.trim() }
          : s,
      ),
    }));
    setEditingIdx(null);
    setStyleDialogOpen(false);
    setEditingStyle({ name: '', description: '', rule: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    updateJournalMutation.mutate({
      journalId,
      data: {
        name: formData.name.trim(),
        styles: formData.styles,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={BTN.EDIT_OUTLINE}>
          <Pencil className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Update Journal</SheetTitle>
          <SheetDescription>
            Edit journal details and manage writing styles.
          </SheetDescription>
        </SheetHeader>
        <form
          id="update-journal-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="update-journal-name"
              className="text-sm font-medium"
            >
              Journal Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="update-journal-name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder="Enter journal name"
              required
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Writing Styles</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOpenAddStyleDialog}
              >
                <Plus className="size-3.5" />
                Add Style
              </Button>
            </div>

            {formData.styles.length > 0 && (
              <div className="space-y-2">
                {formData.styles.map((style, idx) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">
                        {style.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30"
                          onClick={() => handleEditStyle(idx)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                          onClick={() => handleRemoveStyle(idx)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {styleDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-background w-full max-w-2xl rounded-lg border shadow-lg">
              <div className="border-b px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      {styleDialogMode === 'add'
                        ? 'Add New Style'
                        : 'Edit Style'}
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      {styleDialogMode === 'add'
                        ? 'Fill style information and click Add Style.'
                        : 'Update style information and click Save Style.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => {
                      setStyleDialogOpen(false);
                      setEditingIdx(null);
                      setEditingStyle({
                        name: '',
                        description: '',
                        rule: '',
                      });
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 px-4 py-3">
                <Input
                  value={editingStyle.name}
                  onChange={(e) =>
                    setEditingStyle((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Style name"
                  className="h-8 text-sm"
                />
                <textarea
                  value={editingStyle.description}
                  onChange={(e) =>
                    setEditingStyle((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                />
                <textarea
                  value={editingStyle.rule}
                  onChange={(e) =>
                    setEditingStyle((prev) => ({
                      ...prev,
                      rule: e.target.value,
                    }))
                  }
                  placeholder="Rule"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-36 w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                />
              </div>
              <div className="flex gap-2 border-t px-4 py-3">
                <Button
                  type="button"
                  size="sm"
                  className={`${BTN.EDIT} w-full`}
                  onClick={
                    styleDialogMode === 'add'
                      ? handleAddStyle
                      : handleUpdateExistingStyle
                  }
                  disabled={!editingStyle.name.trim()}
                >
                  {styleDialogMode === 'add' ? 'Add Style' : 'Save Style'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStyleDialogOpen(false);
                    setEditingIdx(null);
                    setEditingStyle({
                      name: '',
                      description: '',
                      rule: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className={BTN.CANCEL}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="update-journal-form"
            disabled={updateJournalMutation.isPending || !formData.name.trim()}
            className={BTN.EDIT}
          >
            {updateJournalMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
