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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useTransitionPaperStatus } from '../api/transition-paper-status';
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_TRANSITIONS,
} from '../constants';
import { Loader } from 'lucide-react';

const REVISION_REQUIRED_STATUS = 3;

const REVISION_TYPE_OPTIONS = [
  {
    value: 'minor',
    label: 'Minor revisions',
    description:
      'The manuscript requires minor revisions and improvements before final acceptance.',
  },
  {
    value: 'major',
    label: 'Major revisions',
    description:
      'The manuscript requires significant revisions and further review before a final decision.',
  },
];

// ── StatusTransitionDialog ─────────────────────────────────────────────────

type StatusTransitionDialogProps = {
  paperId: string;
  projectId: string;
  currentStatus: number;
};

export const StatusTransitionDialog = ({
  paperId,
  projectId,
  currentStatus,
}: StatusTransitionDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [targetStatus, setTargetStatus] = React.useState<string>('');
  const [revisionType, setRevisionType] = React.useState<string>('');
  const [note, setNote] = React.useState('');

  const availableTransitions =
    SUBMISSION_STATUS_TRANSITIONS[currentStatus] ?? [];
  const isRevisionRequired = Number(targetStatus) === REVISION_REQUIRED_STATUS;

  const reset = () => {
    setTargetStatus('');
    setRevisionType('');
    setNote('');
  };

  const transitionMutation = useTransitionPaperStatus({
    paperId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Status updated');
        setOpen(false);
        reset();
      },
      onError: () => {
        toast.error('Failed to update status');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;
    if (isRevisionRequired && !revisionType) return;

    transitionMutation.mutate({
      projectId,
      targetStatus: Number(targetStatus),
      note: note.trim() || undefined,
      revisionType: isRevisionRequired ? revisionType : undefined,
    });
  };

  if (availableTransitions.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="darkRed" size="action">
          Update Status
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Move this paper to a new workflow stage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Target status */}
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Target Status
            </p>
            <Select
              value={targetStatus}
              onValueChange={(v) => {
                setTargetStatus(v);
                setRevisionType('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a status…" />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {SUBMISSION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Revision type — only for Revision Required */}
          {isRevisionRequired && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Revision Type
              </p>
              {REVISION_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`revision-type-${opt.value}`}
                  aria-label={opt.label}
                  className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors ${
                    revisionType === opt.value
                      ? 'border-foreground bg-card'
                      : 'border-border hover:border-foreground/40'
                  }`}
                >
                  <input
                    id={`revision-type-${opt.value}`}
                    type="radio"
                    name="revisionType"
                    value={opt.value}
                    checked={revisionType === opt.value}
                    onChange={() => setRevisionType(opt.value)}
                    className="mt-0.5 shrink-0 accent-current"
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm leading-none font-semibold">
                      {opt.label}
                    </p>
                    <p className="text-muted-foreground text-xs leading-snug">
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Note{' '}
              <span className="font-normal tracking-normal normal-case">
                (optional)
              </span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={transitionMutation.isPending}
            >
              CANCEL
            </Button>
            <Button
              variant="darkRed"
              type="submit"
              size="sm"
              disabled={
                !targetStatus ||
                (isRevisionRequired && !revisionType) ||
                transitionMutation.isPending
              }
            >
              {transitionMutation.isPending ? <Loader /> : 'SAVE'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
