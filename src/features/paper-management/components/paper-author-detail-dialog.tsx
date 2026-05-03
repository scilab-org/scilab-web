import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/user-avatar';

import type { PaperContributorItem } from '../types';

type PaperAuthorDetailDialogProps = {
  author: PaperContributorItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const getRecordText = (author: PaperContributorItem, key: string) => {
  const value = (author as Record<string, unknown>)[key];
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const getDisplayName = (author: PaperContributorItem) => {
  const fullName = `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim();
  if (fullName) return fullName;

  return (
    getRecordText(author, 'name') ??
    author.contributorName ??
    getRecordText(author, 'username') ??
    'Unknown Author'
  );
};

const getRoleDisplayLabel = (role: string | null | undefined) => {
  const normalized = (role ?? '').trim().toLowerCase();
  const raw = normalized.includes(':')
    ? (normalized.split(':').pop() ?? normalized)
    : normalized;

  if (normalized === 'paper:author') return 'Head Writer';
  if (raw === 'author') return 'Author';
  if (raw === 'member') return 'Member';
  if (raw === 'edit') return 'Editor';
  if (raw === 'read' || raw === 'view') return 'Viewer';
  if (raw === 'manager') return 'Manager';

  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : (role ?? '');
};

const Field = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="space-y-0.5">
    <p className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
      {label}
    </p>
    <p
      className={`text-foreground text-base font-medium ${mono ? 'font-mono' : ''}`}
    >
      {value}
    </p>
  </div>
);

export const PaperAuthorDetailDialog = ({
  author,
  open,
  onOpenChange,
}: PaperAuthorDetailDialogProps) => {
  if (!author) return null;

  const fullName = getDisplayName(author);
  const email =
    getRecordText(author, 'email') ?? author.contributorEmail ?? '—';
  const roleName = author.authorRoleName || author.sectionRole;
  const roleLabel = getRoleDisplayLabel(roleName);
  const roleDescription = author.authorRoleDescription?.trim() || null;
  const orcid =
    getRecordText(author, 'orcid') ??
    getRecordText(author, 'ocrid') ??
    getRecordText(author, 'ocrId') ??
    '—';
  const affiliation =
    getRecordText(author, 'affiliationName') ??
    getRecordText(author, 'affiliation') ??
    '—';
  const department = author.department?.trim() || null;
  const position = author.position?.trim() || null;
  const affiliationStartYear = author.affiliationStartYear ?? null;
  const affiliationEndYear = author.affiliationEndYear ?? null;

  const isHeadWriter = roleLabel === 'Head Writer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>CRediT Author Details</DialogTitle>
        </DialogHeader>

        {/* Author identity */}
        <div className="flex items-center gap-3">
          <UserAvatar
            firstName={author.firstName || ''}
            username={fullName}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-xl font-bold">
              {fullName}
            </p>
            <p className="text-muted-foreground truncate text-base">{email}</p>
          </div>
          <Badge
            variant={isHeadWriter ? 'admin' : 'outline'}
            className="shrink-0 font-mono text-[10px] tracking-widest uppercase"
          >
            {roleLabel || 'No Role'}
          </Badge>
        </div>

        <Separator />

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="ORCID" value={orcid} mono />
          <Field label="Affiliation" value={affiliation} />
          {department && <Field label="Department" value={department} />}
          {position && <Field label="Position" value={position} />}
          {affiliationStartYear !== null && (
            <Field
              label="Affiliation Period"
              value={`${affiliationStartYear}${affiliationEndYear ? ` – ${affiliationEndYear}` : ' – Present'}`}
            />
          )}
          {author.authorRoleName && (
            <Field label="Author Role" value={author.authorRoleName} />
          )}
          {roleDescription && (
            <div className="col-span-2">
              <Field label="Role Description" value={roleDescription} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
