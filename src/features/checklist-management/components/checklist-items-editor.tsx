import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { FIELD_LABEL_CLASS } from '../constants';
import { CheckListItemDto, CheckListItemPayload } from '../types';

export type CheckListItemFormRow = {
  _key: string;
  id: string;
  name: string;
  rule: string;
  weight: string;
};

export const createCheckListItemFormRow = (
  overrides: Partial<Omit<CheckListItemFormRow, '_key'>> = {},
): CheckListItemFormRow => ({
  _key: crypto.randomUUID(),
  id: overrides.id ?? '',
  name: overrides.name ?? '',
  rule: overrides.rule ?? '',
  weight: overrides.weight ?? '',
});

export const mapCheckListItemToFormRow = (
  item: CheckListItemDto,
): CheckListItemFormRow =>
  createCheckListItemFormRow({
    id: item.id,
    name: item.name,
    rule: item.rule,
    weight: String(item.weight),
  });

export const isCheckListItemFormRowValid = (row: CheckListItemFormRow) => {
  const weight = Number(row.weight);

  return Boolean(
    row.name.trim() &&
    row.rule.trim() &&
    row.weight !== '' &&
    !Number.isNaN(weight) &&
    weight > 0,
  );
};

export const normalizeCheckListItemFormRows = (
  rows: CheckListItemFormRow[],
): CheckListItemPayload[] =>
  rows.map((row) => ({
    id: row.id.trim() || crypto.randomUUID(),
    name: row.name.trim(),
    rule: row.rule.trim(),
    weight: Number(row.weight),
  }));

interface CheckListItemsEditorProps {
  rows: CheckListItemFormRow[];
  onChange: React.Dispatch<React.SetStateAction<CheckListItemFormRow[]>>;
  optional?: boolean;
}

export const CheckListItemsEditor = ({
  rows,
  onChange,
  optional = false,
}: CheckListItemsEditorProps) => {
  const dragItemRef = React.useRef<number | null>(null);
  const dragOverItemRef = React.useRef<number | null>(null);
  const itemCardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingScrollKey, setPendingScrollKey] = React.useState<string | null>(
    null,
  );

  const updateRow = (
    key: string,
    field: keyof Omit<CheckListItemFormRow, '_key'>,
    value: string,
  ) => {
    onChange((prev) =>
      prev.map((row) => (row._key === key ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => {
    const newRow = createCheckListItemFormRow();
    setPendingScrollKey(newRow._key);
    onChange((prev) => [...prev, newRow]);
  };

  const removeRow = (key: string) => {
    onChange((prev) => prev.filter((row) => row._key !== key));
  };

  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
  };

  const handleDrop = () => {
    const from = dragItemRef.current;
    const to = dragOverItemRef.current;

    if (from === null || to === null || from === to) {
      dragItemRef.current = null;
      dragOverItemRef.current = null;
      return;
    }

    onChange((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(from, 1);
      updated.splice(to, 0, dragged);
      return updated;
    });

    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  React.useEffect(() => {
    if (!pendingScrollKey) return;
    const card = itemCardRefs.current[pendingScrollKey];
    if (!card) return;
    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const firstInput = card.querySelector<HTMLElement>('input, textarea');
      firstInput?.focus();
      setPendingScrollKey(null);
    });
  }, [rows, pendingScrollKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className={FIELD_LABEL_CLASS}>
            Checklist Items{' '}
            {!optional && <span className="text-destructive">*</span>}
          </p>
          <p className="text-muted-foreground text-sm">
            {optional
              ? 'You can leave items empty when updating only the section.'
              : 'Each item requires a name, rule, and weight.'}
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
          No checklist items added.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row._key}
              ref={(node) => {
                itemCardRefs.current[row._key] = node;
              }}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="bg-muted/20 space-y-2 rounded-md border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex w-5 shrink-0 items-center justify-center">
                  <span className="text-muted-foreground text-xs font-medium">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1">
                  <label
                    htmlFor={`checklist-item-name-${row._key}`}
                    className="sr-only"
                  >
                    Name
                  </label>
                  <Input
                    id={`checklist-item-name-${row._key}`}
                    value={row.name}
                    onChange={(e) =>
                      updateRow(row._key, 'name', e.target.value)
                    }
                    placeholder="Item name"
                    required
                    onDragStart={(e) => e.stopPropagation()}
                    className="h-9 rounded-md text-sm"
                  />
                </div>

                <div className="w-28 shrink-0">
                  <label
                    htmlFor={`checklist-item-weight-${row._key}`}
                    className="sr-only"
                  >
                    Weight
                  </label>
                  <Input
                    id={`checklist-item-weight-${row._key}`}
                    type="number"
                    inputMode="numeric"
                    value={row.weight}
                    onChange={(e) =>
                      updateRow(row._key, 'weight', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === '-' ||
                        e.key === '+' ||
                        e.key === 'e' ||
                        e.key === '.'
                      ) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Weight"
                    required
                    min={1}
                    onDragStart={(e) => e.stopPropagation()}
                    className="h-9 rounded-md text-sm"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-red-500 hover:text-red-600"
                  onClick={() => removeRow(row._key)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex items-start gap-3">
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  className="flex w-5 shrink-0 cursor-grab justify-center pt-2.5"
                  aria-label="Drag item"
                >
                  <div className="grid grid-cols-2 gap-x-0.5 gap-y-0.5">
                    <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                    <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                    <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                    <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                    <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                    <span className="bg-muted-foreground/70 block h-1 w-1 rounded-full" />
                  </div>
                </div>

                <div className="flex-1">
                  <label
                    htmlFor={`checklist-item-rule-${row._key}`}
                    className="sr-only"
                  >
                    Rule
                  </label>
                  <textarea
                    id={`checklist-item-rule-${row._key}`}
                    value={row.rule}
                    onChange={(e) =>
                      updateRow(row._key, 'rule', e.target.value)
                    }
                    placeholder="Rule"
                    required
                    rows={3}
                    onDragStart={(e) => e.stopPropagation()}
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-16 w-full resize-none rounded-md border bg-transparent px-3 py-2 font-sans text-sm shadow-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
