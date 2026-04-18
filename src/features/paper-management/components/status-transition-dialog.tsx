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
import { Skeleton } from '@/components/ui/skeleton';

import { useGetPaperVersionFiles } from '../api/get-paper-version-files';
import { useGetPaperVersions } from '../api/get-paper-versions';
import { useTransitionPaperStatus } from '../api/transition-paper-status';
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_TRANSITIONS,
} from '../constants';
import { ExternalLink, Loader } from 'lucide-react';

const REVISION_REQUIRED_STATUS = 3;
const SUBMITTED_STATUS = 2;
const RESUBMITTED_STATUS = 4;

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

const requiresPdf = (status: number) =>
  status === SUBMITTED_STATUS || status === RESUBMITTED_STATUS;

// ── FileVersionSelector ────────────────────────────────────────────────────

type FileVersionSelectorProps = {
  paperId: string;
  selectedVersionId: string;
  onVersionChange: (versionId: string) => void;
  selectedFileId: string;
  onFileChange: (fileId: string) => void;
};

const FileVersionSelector = ({
  paperId,
  selectedVersionId,
  onVersionChange,
  selectedFileId,
  onFileChange,
}: FileVersionSelectorProps) => {
  const versionsQuery = useGetPaperVersions({ paperId });
  const versions = (versionsQuery.data as any)?.result?.items ?? [];
  const versionsLoading = versionsQuery.isLoading;

  const filesQuery = useGetPaperVersionFiles({
    paperId,
    versionId: selectedVersionId,
  });

  const files = filesQuery.data?.items ?? [];

  const selectedFile = files.find((f) => f.id === selectedFileId);

  return (
    <>
      {/* Step 1: Select version */}
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Paper Version
        </p>
        {versionsLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : versions.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No versions available. Combine your paper first.
          </p>
        ) : (
          <Select value={selectedVersionId} onValueChange={onVersionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a version…" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v: { id: string; name: string }) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name || `Version ${v.id.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Step 2: Select file */}
      {selectedVersionId && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            PDF File
          </p>
          {filesQuery.isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : files.length === 0 ? (
            <p className="text-destructive text-xs">
              No files found for this version. Please generate or upload a file
              first.
            </p>
          ) : (
            <>
              <Select value={selectedFileId} onValueChange={onFileChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a file…" />
                </SelectTrigger>
                <SelectContent>
                  {files.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFile && (
                <a
                  href={selectedFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
                >
                  <ExternalLink className="size-3" />
                  View PDF
                </a>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

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
  const [selectedVersionId, setSelectedVersionId] = React.useState<string>('');
  const [selectedPdfId, setSelectedPdfId] = React.useState<string>('');

  const availableTransitions =
    SUBMISSION_STATUS_TRANSITIONS[currentStatus] ?? [];
  const isRevisionRequired = Number(targetStatus) === REVISION_REQUIRED_STATUS;
  const isPdfRequired = requiresPdf(Number(targetStatus));

  const reset = () => {
    setTargetStatus('');
    setRevisionType('');
    setNote('');
    setSelectedVersionId('');
    setSelectedPdfId('');
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
    if (isPdfRequired && !selectedPdfId) return;

    transitionMutation.mutate({
      projectId,
      targetStatus: Number(targetStatus),
      note: note.trim() || undefined,
      revisionType: isRevisionRequired ? revisionType : undefined,
      pdfFileId: isPdfRequired ? selectedPdfId : undefined,
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
                setSelectedVersionId('');
                setSelectedPdfId('');
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

          {/* File version selection — only for Submitted / Resubmitted */}
          {isPdfRequired && (
            <FileVersionSelector
              paperId={paperId}
              selectedVersionId={selectedVersionId}
              onVersionChange={(versionId) => {
                setSelectedVersionId(versionId);
                setSelectedPdfId('');
              }}
              selectedFileId={selectedPdfId}
              onFileChange={setSelectedPdfId}
            />
          )}

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
                (isPdfRequired && !selectedPdfId) ||
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
