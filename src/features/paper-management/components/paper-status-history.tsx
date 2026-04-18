import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { formatLocalDate, formatLocalDateTime } from '@/utils/date-utils';

import { usePaperStatusHistory } from '../api/get-paper-status-history';
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_TRANSITIONS,
} from '../constants';
import { PaperStatusHistoryEntry } from '../types';
import { StatusTransitionDialog } from './status-transition-dialog';
import { ExternalLink } from 'lucide-react';

const REVISION_TYPE_LABELS: Record<string, string> = {
  minor: 'Minor revisions',
  major: 'Major revisions',
};

// Status-specific classes for the selected (highlighted) item
const getStatusClasses = (
  status: number,
): { indicator: string; label: string } => {
  switch (status) {
    case 3: // RevisionRequired
      return { indicator: 'bg-tertiary', label: 'text-tertiary' };
    case 7: // Rejected
      return { indicator: 'bg-destructive', label: 'text-destructive' };
    case 8: // OnHold
      return { indicator: 'bg-amber-500', label: 'text-amber-600' };
    default:
      return { indicator: 'bg-foreground', label: 'text-foreground' };
  }
};

// ── CurrentStatusDetail ────────────────────────────────────────────────────

const CurrentStatusDetail = ({ entry }: { entry: PaperStatusHistoryEntry }) => {
  return (
    <div className="space-y-4 pb-6">
      <div className="space-y-1">
        <h3 className="font-newsreader text-2xl leading-tight font-normal">
          {SUBMISSION_STATUS_LABELS[entry.status] ?? `Status ${entry.status}`}
        </h3>
        <p className="text-muted-foreground text-xs">
          Logged: {formatLocalDateTime(entry.createdOnUtc)}
        </p>
      </div>

      {entry.revisionType && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            Revision Type
          </p>
          <div className="bg-card rounded-sm border p-4">
            <p className="text-sm leading-relaxed">
              {REVISION_TYPE_LABELS[entry.revisionType] ?? entry.revisionType}
            </p>
          </div>
        </div>
      )}

      {entry.pdfFileUrl && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            Attached PDF
          </p>
          <div className="bg-card flex items-center justify-between rounded-sm border p-4">
            <p className="text-sm leading-relaxed">
              {entry.pdfFileName ?? 'PDF File'}
            </p>
            <a
              href={entry.pdfFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
            >
              <ExternalLink className="size-3" />
              View PDF
            </a>
          </div>
        </div>
      )}

      {entry.note && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            Note
          </p>
          <div className="bg-card rounded-sm border p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {entry.note}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── StatusTimelineItem ─────────────────────────────────────────────────────

type StatusTimelineItemProps = {
  entry: PaperStatusHistoryEntry;
  isLatest: boolean;
  isSelected: boolean;
  onSelect: (entry: PaperStatusHistoryEntry) => void;
};

const StatusTimelineItem = ({
  entry,
  isLatest,
  isSelected,
  onSelect,
}: StatusTimelineItemProps) => {
  const { indicator, label } = getStatusClasses(entry.status);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={cn(
        'flex w-full cursor-pointer items-start gap-4 rounded-sm px-2 py-3 text-left transition-colors',
        isSelected ? 'bg-muted/60' : 'hover:bg-muted/40',
      )}
    >
      {/* Square indicator */}
      <div
        className={cn(
          'mt-1 size-2.5 shrink-0 rounded-none',
          isLatest ? indicator : 'bg-muted-foreground/40',
        )}
      />

      {/* Date */}
      <span className="text-muted-foreground w-24 shrink-0 text-xs tabular-nums">
        {formatLocalDate(entry.createdOnUtc)}
      </span>

      {/* Status label + optional note */}
      <div className="space-y-0.5">
        <p
          className={cn(
            'text-sm leading-none font-semibold',
            isLatest ? label : 'text-foreground',
          )}
        >
          {SUBMISSION_STATUS_LABELS[entry.status] ?? `Status ${entry.status}`}
        </p>
        {entry.note && (
          <p className="text-muted-foreground line-clamp-1 text-xs leading-snug">
            {entry.note}
          </p>
        )}
      </div>
    </button>
  );
};

// ── StatusTimeline ─────────────────────────────────────────────────────────

type StatusTimelineProps = {
  entries: PaperStatusHistoryEntry[];
  selectedId: string;
  onSelect: (entry: PaperStatusHistoryEntry) => void;
};

const StatusTimeline = ({
  entries,
  selectedId,
  onSelect,
}: StatusTimelineProps) => {
  if (entries.length === 0) return null;

  return (
    <div className="divide-y divide-transparent">
      {entries.map((entry, i) => (
        <StatusTimelineItem
          key={entry.id}
          entry={entry}
          isLatest={i === 0}
          isSelected={entry.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

// ── PaperStatusHistory (public export) ────────────────────────────────────

type PaperStatusHistoryProps = {
  paperId: string;
  projectId?: string;
};

export const PaperStatusHistory = ({
  paperId,
  projectId,
}: PaperStatusHistoryProps) => {
  const historyQuery = usePaperStatusHistory({ paperId });

  const history = historyQuery.data?.history ?? [];
  const currentStatus = historyQuery.data?.currentStatus ?? 1;
  const latestEntry = history.length > 0 ? history[0] : null;
  const isTerminal =
    (SUBMISSION_STATUS_TRANSITIONS[currentStatus] ?? []).length === 0;
  const canTransition = !isTerminal && !!projectId;

  const [selectedEntry, setSelectedEntry] =
    React.useState<PaperStatusHistoryEntry | null>(null);

  // Keep selected entry in sync when data loads or refreshes
  React.useEffect(() => {
    setSelectedEntry(latestEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEntry?.id]);

  const displayEntry = selectedEntry ?? latestEntry;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-foreground text-xs font-semibold tracking-widest uppercase">
            Status History
          </p>
          {canTransition && (
            <StatusTransitionDialog
              paperId={paperId}
              projectId={projectId!}
              currentStatus={currentStatus}
            />
          )}
        </div>
        <div className="bg-border/60 h-px" />
      </div>

      {/* Loading */}
      {historyQuery.isLoading && (
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {/* Error */}
      {historyQuery.isError && (
        <p className="text-destructive py-4 text-sm">
          Failed to load status history.
        </p>
      )}

      {/* Empty — default draft state */}
      {!historyQuery.isLoading &&
        !historyQuery.isError &&
        history.length === 0 && (
          <p className="text-muted-foreground py-4 text-sm">
            No status changes recorded. This paper is in its initial draft
            state.
          </p>
        )}

      {/* Two-column layout: timeline left, detail right */}
      {history.length > 0 && (
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Left: timeline */}
          <div className="md:w-1/2">
            <StatusTimeline
              entries={history}
              selectedId={displayEntry?.id ?? ''}
              onSelect={setSelectedEntry}
            />
          </div>

          {/* Right: detail */}
          <div className="md:w-1/2">
            {displayEntry && <CurrentStatusDetail entry={displayEntry} />}
          </div>
        </div>
      )}
    </div>
  );
};
