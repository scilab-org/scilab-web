import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
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

import { createPaperDirectFile } from '../api/create-paper-version-file';
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
  const [uploadMode, setUploadMode] = React.useState<'version' | 'direct'>(
    'version',
  );
  const [directFile, setDirectFile] = React.useState<File | null>(null);
  const [submittedUrl, setSubmittedUrl] = React.useState<string>('');

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
    setUploadMode('version');
    setDirectFile(null);
    setSubmittedUrl('');
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

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      createPaperDirectFile({ paperId, data: { file } }),
    onSuccess: (response) => {
      transitionMutation.mutate({
        projectId,
        targetStatus: Number(targetStatus),
        note: note.trim() || undefined,
        revisionType: isRevisionRequired ? revisionType : undefined,
        pdfFileId: response.value,
        submittedUrl: submittedUrl.trim() || undefined,
      });
    },
    onError: () => {
      toast.error('Failed to upload PDF');
    },
  });

  const isPending = transitionMutation.isPending || uploadMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;
    if (isRevisionRequired && !revisionType) return;
    if (isPdfRequired) {
      if (uploadMode === 'direct') {
        if (!directFile) return;
        uploadMutation.mutate(directFile);
      } else {
        if (!selectedPdfId) return;
        transitionMutation.mutate({
          projectId,
          targetStatus: Number(targetStatus),
          note: note.trim() || undefined,
          revisionType: isRevisionRequired ? revisionType : undefined,
          pdfFileId: selectedPdfId,
          submittedUrl: submittedUrl.trim() || undefined,
        });
      }
      return;
    }

    transitionMutation.mutate({
      projectId,
      targetStatus: Number(targetStatus),
      note: note.trim() || undefined,
      revisionType: isRevisionRequired ? revisionType : undefined,
      pdfFileId: undefined,
    });
  };

  const isSubmitDisabled =
    !targetStatus ||
    (isRevisionRequired && !revisionType) ||
    (isPdfRequired && uploadMode === 'version' && !selectedPdfId) ||
    (isPdfRequired && uploadMode === 'direct' && !directFile) ||
    isPending;

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

          {/* PDF attachment — only for Submitted / Resubmitted */}
          {isPdfRequired && (
            <div className="space-y-3">
              {/* Mode toggle */}
              <div className="flex overflow-hidden rounded-md border text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('version');
                    setDirectFile(null);
                  }}
                  className={`flex-1 py-1.5 transition-colors ${
                    uploadMode === 'version'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Select from versions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('direct');
                    setSelectedVersionId('');
                    setSelectedPdfId('');
                  }}
                  className={`flex-1 py-1.5 transition-colors ${
                    uploadMode === 'direct'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Upload PDF directly
                </button>
              </div>

              {uploadMode === 'version' ? (
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
              ) : (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                    PDF File
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setDirectFile(e.target.files?.[0] ?? null)}
                    className="border-input text-foreground file:bg-muted file:text-foreground w-full cursor-pointer rounded-md border px-3 py-1.5 text-xs file:mr-2 file:rounded file:border-0 file:px-2 file:py-1 file:text-xs file:font-medium"
                  />
                  {directFile && (
                    <p className="text-muted-foreground text-xs">
                      {directFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submitted URL — only for Submitted / Resubmitted */}
          {isPdfRequired && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                Submission URL{' '}
                <span className="font-normal tracking-normal normal-case">
                  (optional)
                </span>
              </p>
              <input
                type="url"
                value={submittedUrl}
                onChange={(e) => setSubmittedUrl(e.target.value)}
                placeholder="https://…"
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              />
            </div>
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
              disabled={isPending}
            >
              CANCEL
            </Button>
            <Button
              variant="darkRed"
              type="submit"
              size="sm"
              disabled={isSubmitDisabled}
            >
              {isPending ? <Loader /> : 'SAVE'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
