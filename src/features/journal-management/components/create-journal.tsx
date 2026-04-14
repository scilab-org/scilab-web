import * as React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
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

import { CreateButton } from '@/components/ui/create-button';

import { useCreateJournal } from '../api/create-journal';
import { JournalStyle } from '../types';

const initialFormData = {
  name: '',
  styles: [] as JournalStyle[],
};

export const CreateJournal = () => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(initialFormData);
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = React.useState(false);
  const [styleDialogMode, setStyleDialogMode] = React.useState<'add' | 'edit'>(
    'add',
  );
  const [editingStyle, setEditingStyle] = React.useState<JournalStyle>({
    name: '',
    description: '',
    rule: '',
  });

  const createJournalMutation = useCreateJournal({
    mutationConfig: {
      onSuccess: () => {
        setOpen(false);
        setFormData(initialFormData);
        setEditingIdx(null);
        setStyleDialogOpen(false);
        setEditingStyle({ name: '', description: '', rule: '' });
        toast.success('Journal created successfully');
      },
      onError: (error: any) => {
        const errorData = error?.response?.data;
        if (
          errorData?.errors?.[0]?.errorMessage === 'JOURNAL_NAME_ALREADY_EXISTS'
        ) {
          toast.error('Journal name already exists');
        } else {
          toast.error('Failed to create journal');
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
    setStyleDialogOpen(false);
    setEditingStyle({ name: '', description: '', rule: '' });
    setEditingIdx(null);
  };

  const handleEditStyle = (index: number) => {
    setEditingIdx(index);
    setStyleDialogMode('edit');
    setEditingStyle(formData.styles[index]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createJournalMutation.mutate({
      name: formData.name.trim(),
      styles: formData.styles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CreateButton size="sm" className="uppercase">
          CREATE JOURNAL
        </CreateButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Journal</DialogTitle>
          <DialogDescription>
            Fill in the journal details and add writing styles.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-journal-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto px-4 py-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="create-journal-name"
              className="text-sm font-medium"
            >
              Journal Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="create-journal-name"
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
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-36 w-full rounded-md border px-3 py-2 font-sans text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                />
              </div>
              <div className="flex gap-2 border-t px-4 py-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full uppercase"
                  onClick={
                    styleDialogMode === 'add'
                      ? handleAddStyle
                      : handleUpdateExistingStyle
                  }
                  disabled={!editingStyle.name.trim()}
                >
                  {styleDialogMode === 'add' ? 'ADD STYLE' : 'SAVE STYLE'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="uppercase"
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
                  CANCEL
                </Button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="uppercase"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            form="create-journal-form"
            disabled={createJournalMutation.isPending || !formData.name.trim()}
            variant="secondary"
            className="uppercase"
          >
            {createJournalMutation.isPending ? 'CREATING...' : 'CREATE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
