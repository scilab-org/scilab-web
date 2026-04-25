import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const isHeadWriter = roleLabel === 'Head Writer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Author Details</DialogTitle>
          <DialogDescription>
            Detailed information about this paper author.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4 pr-1">
          <div className="flex items-center gap-4">
            <UserAvatar
              firstName={author.firstName || ''}
              username={fullName}
              size="lg"
            />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-foreground text-xl font-bold">{fullName}</h2>
              <Badge
                variant={isHeadWriter ? 'admin' : 'outline'}
                className="w-fit font-mono text-[10px] tracking-widest uppercase"
              >
                {roleLabel || 'No Role'}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="gap-0">
              <CardHeader className="px-6 pt-4 pb-2">
                <CardTitle className="text-muted-foreground font-mono text-xs font-semibold tracking-widest uppercase">
                  Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                    Email Address
                  </p>
                  <p className="text-foreground font-medium">{email || '—'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0">
              <CardHeader className="px-6 pt-4 pb-2">
                <CardTitle className="text-muted-foreground font-mono text-xs font-semibold tracking-widest uppercase">
                  Academic Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                    ORCID
                  </p>
                  <p className="text-foreground font-mono text-sm">{orcid}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                    Affiliation
                  </p>
                  <p className="text-foreground font-medium">{affiliation}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {(author.authorRoleName || roleDescription) && (
            <Card className="gap-0">
              <CardHeader className="px-6 pt-4 pb-2">
                <CardTitle className="text-muted-foreground font-mono text-xs font-semibold tracking-widest uppercase">
                  Role Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {author.authorRoleName && (
                  <div>
                    <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                      Role Name
                    </p>
                    <p className="text-foreground font-medium">
                      {author.authorRoleName}
                    </p>
                  </div>
                )}
                {roleDescription && (
                  <div>
                    <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
                      Description
                    </p>
                    <p className="text-foreground text-sm leading-relaxed">
                      {roleDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
