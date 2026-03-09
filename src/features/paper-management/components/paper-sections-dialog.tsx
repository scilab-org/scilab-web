import { useState } from 'react';
import { Dialog } from 'radix-ui';
import {
  X,
  Layers,
  UserPlus,
  ArrowLeft,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
  Trash2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BTN } from '@/lib/button-styles';
import { cn } from '@/utils/cn';

import { useGroups } from '@/features/group-role-management/api/get-groups';

import { useAssignedSections } from '../api/get-assigned-sections';
import { useCreatePaperContributor } from '../api/create-paper-contributor';
import { useAvailableSectionMembers } from '../api/get-available-section-members';
import { useGetSectionMembers } from '../api/get-section-members';
import { useDeletePaperContributor } from '../api/delete-paper-contributor';
import { useUpdatePaperContributor } from '../api/update-paper-contributor';
import {
  AssignedSection,
  AvailableSectionMember,
  SectionMember,
} from '../types';

// ─── LaTeX utility ────────────────────────────────────────────────────────────

const stripLatex = (input: string): string => {
  if (!input) return '(Untitled)';
  let s = input;
  const cmdPat = /\\[a-zA-Z*]+\{([^{}]*)\}/g;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(cmdPat, '$1');
  }
  s = s
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\\^/g, '^')
    .replace(/\\~/g, '~')
    .replace(/\\-/g, '-')
    .replace(/\\\\/g, '');
  return s.replace(/[{}]/g, '').trim() || '(Untitled)';
};

// ─── Tree builder ─────────────────────────────────────────────────────────────

type SectionNode = AssignedSection & { children: SectionNode[] };

const buildTree = (sections: AssignedSection[]): SectionNode[] => {
  const map = new Map<string, SectionNode>();
  sections.forEach((s) => map.set(s.id, { ...s, children: [] }));

  const roots: SectionNode[] = [];
  sections.forEach((s) => {
    if (s.parentSectionId && map.has(s.parentSectionId)) {
      map.get(s.parentSectionId)!.children.push(map.get(s.id)!);
    } else {
      roots.push(map.get(s.id)!);
    }
  });

  const sortByOrder = (arr: SectionNode[]) =>
    arr.sort((a, b) => a.displayOrder - b.displayOrder);

  sortByOrder(roots);
  roots.forEach((r) => sortByOrder(r.children));
  return roots;
};

type PaperSectionsDialogProps = {
  paperId: string;
  paperTitle: string;
  subProjectId: string;
  isAuthor?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ─── Assign Member Panel ──────────────────────────────────────────────────────

type AssignPanelProps = {
  section: AssignedSection;
  paperId: string;
  subProjectId: string;
  onBack: () => void;
  onAssigned: () => void;
};

const AssignPanel = ({
  section,
  paperId,
  subProjectId: _subProjectId,
  onBack,
  onAssigned,
}: AssignPanelProps) => {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] =
    useState<AvailableSectionMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleOpen, setRoleOpen] = useState(false);

  const membersQuery = useAvailableSectionMembers({
    sectionId: section.id,
    paperId,
  });
  const members: AvailableSectionMember[] =
    membersQuery.data?.result?.items ?? [];

  const groupsQuery = useGroups();
  const sectionGroups = (groupsQuery.data?.result ?? []).filter((g) =>
    g.name?.toLowerCase().startsWith('section'),
  );

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.email?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    );
  });

  const assignMutation = useCreatePaperContributor({
    paperId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Member assigned to section successfully');
        onAssigned();
      },
      onError: () => {
        toast.error('Failed to assign member. Please try again.');
      },
    },
  });

  const handleAssign = () => {
    if (!selectedMember || !selectedRole) return;
    assignMutation.mutate({
      paperId,
      markSectionId: section.id,
      memberId: selectedMember.memberId,
      sectionRole: selectedRole,
    });
  };

  const canSubmit =
    !!selectedMember && !!selectedRole && !assignMutation.isPending;

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-3 border-b px-6 py-4">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-base font-semibold">
            Assign Member to Section
          </h3>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">Section Role</p>
          {groupsQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : sectionGroups.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No section roles available
            </p>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleOpen((p) => !p)}
                className={cn(
                  'border-border bg-background text-foreground flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                  !selectedRole && 'text-muted-foreground',
                )}
              >
                {selectedRole || 'Select a role...'}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </button>
              {roleOpen && (
                <div className="border-border bg-background absolute z-10 mt-1 w-full rounded-md border shadow-lg">
                  {sectionGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(g.name!);
                        setRoleOpen(false);
                      }}
                      className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                    >
                      {selectedRole === g.name && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                      <span
                        className={selectedRole === g.name ? 'pl-0' : 'pl-6'}
                      >
                        {g.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">Select Member</p>
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          />
        </div>

        <div className="flex-1 space-y-2">
          {membersQuery.isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No members found</p>
            </div>
          ) : (
            filtered.map((m) => {
              const isSelected = selectedMember?.memberId === m.memberId;
              return (
                <div
                  key={m.memberId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMember(isSelected ? null : m)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedMember(isSelected ? null : m);
                    }
                  }}
                  className={cn(
                    'border-border flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'hover:border-blue-300 hover:shadow-sm',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase',
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      (m.firstName?.[0] ?? m.username?.[0] ?? '?')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {m.email}
                      {m.username && ` · @${m.username}`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-border flex items-center justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onBack} className={BTN.CANCEL}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          disabled={!canSubmit}
          className={BTN.SUCCESS}
        >
          {assignMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning…
            </>
          ) : (
            'Assign'
          )}
        </Button>
      </div>
    </div>
  );
};

// ─── Flatten tree for table rendering ────────────────────────────────────────

type FlatRow = { node: SectionNode; depth: number; label: string };

const flattenTree = (
  nodes: SectionNode[],
  depth = 0,
  parentLabel = '',
): FlatRow[] => {
  let counter = 0;
  return nodes.flatMap((n) => {
    if (n.numbered) counter += 1;
    const label = n.numbered
      ? parentLabel
        ? `${parentLabel}.${counter}`
        : `${counter}`
      : '';
    return [
      { node: n, depth, label },
      ...flattenTree(n.children, depth + 1, label),
    ];
  });
};
// ─── View Members Panel ───────────────────────────────────────────────────────

type ViewMembersPanelProps = {
  section: AssignedSection;
  paperId: string;
  isAuthor: boolean;
  onBack: () => void;
};

const ViewMembersPanel = ({
  section,
  paperId,
  isAuthor,
  onBack,
}: ViewMembersPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const membersQuery = useGetSectionMembers({ sectionId: section.id, paperId });
  const members: SectionMember[] = membersQuery.data?.result?.items ?? [];

  const groupsQuery = useGroups();
  const sectionGroups = (groupsQuery.data?.result ?? []).filter((g) =>
    g.name?.toLowerCase().startsWith('section'),
  );

  const deleteMutation = useDeletePaperContributor({
    sectionId: section.id,
    paperId,
    mutationConfig: {
      onSuccess: () => toast.success('Member removed successfully'),
      onError: () => toast.error('Failed to remove member'),
    },
  });

  const updateMutation = useUpdatePaperContributor({
    sectionId: section.id,
    paperId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Role updated successfully');
        setEditingId(null);
      },
      onError: () => toast.error('Failed to update role'),
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-3 border-b px-6 py-4">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-base font-semibold">
            Section Members
          </h3>
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {stripLatex(section.title)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {membersQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-muted-foreground text-sm">
              No members assigned to this section yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Member
                  </TableHead>
                  <TableHead className="w-52 font-semibold text-green-900 dark:text-green-200">
                    Role
                  </TableHead>
                  {isAuthor && (
                    <TableHead className="w-36 text-right font-semibold text-green-900 dark:text-green-200">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m, idx) => {
                  const isProjectRole = m.sectionRole.startsWith('project:');
                  const displayRole = m.sectionRole.includes(':')
                    ? m.sectionRole.split(':').pop()
                    : m.sectionRole;
                  return (
                    <TableRow
                      key={m.id}
                      className={`transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20 ${
                        idx % 2 === 0
                          ? 'bg-white dark:bg-transparent'
                          : 'bg-slate-50/50 dark:bg-slate-900/20'
                      }`}
                    >
                      <TableCell>
                        <p className="text-foreground text-sm font-medium">
                          {m.firstName || m.lastName
                            ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
                            : m.username}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {m.email}
                          {m.username && ` · @${m.username}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        {editingId === m.id ? (
                          <div className="flex flex-wrap gap-1">
                            {sectionGroups.map((g) => {
                              const active =
                                (editingRole || m.sectionRole) === g.name;
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => setEditingRole(g.name!)}
                                  className={cn(
                                    'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all',
                                    active
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:bg-transparent dark:text-blue-300 dark:hover:bg-blue-950/20',
                                  )}
                                >
                                  {g.name?.includes(':')
                                    ? g.name.split(':').pop()
                                    : g.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-xs font-medium',
                              isProjectRole
                                ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                            )}
                          >
                            {displayRole}
                          </span>
                        )}
                      </TableCell>
                      {isAuthor && (
                        <TableCell className="text-right">
                          {!isProjectRole &&
                            (editingId === m.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateMutation.mutate({
                                      id: m.id,
                                      data: {
                                        sectionRole:
                                          editingRole || m.sectionRole,
                                        sectionId: m.sectionId,
                                        memberId: m.memberId,
                                        markSectionId: m.markSectionId,
                                      },
                                    })
                                  }
                                  disabled={updateMutation.isPending}
                                  className={cn(
                                    'h-7 px-2 text-xs',
                                    BTN.SUCCESS,
                                  )}
                                >
                                  {updateMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Save'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className={cn('h-7 px-2 text-xs', BTN.CANCEL)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(m.id);
                                    setEditingRole(m.sectionRole);
                                  }}
                                  className={cn(
                                    'h-7 px-2 text-xs',
                                    BTN.EDIT_OUTLINE,
                                  )}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setConfirmDeleteId(m.id)}
                                  disabled={deleteMutation.isPending}
                                  className={cn(
                                    'h-7 px-2 text-xs',
                                    BTN.DANGER_OUTLINE,
                                  )}
                                >
                                  {deleteMutation.isPending &&
                                  confirmDeleteId === m.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="border-border flex items-center justify-end border-t px-6 py-4">
        <Button variant="outline" onClick={onBack} className={BTN.CANCEL}>
          Back
        </Button>
      </div>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the section? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId) {
                  deleteMutation.mutate(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
// ─── Top-level Section Group ──────────────────────────────────────────────────

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export const PaperSectionsDialog = ({
  paperId,
  paperTitle: _paperTitle,
  subProjectId,
  isAuthor = false,
  open,
  onOpenChange,
}: PaperSectionsDialogProps) => {
  const [assignTarget, setAssignTarget] = useState<AssignedSection | null>(
    null,
  );
  const [viewTarget, setViewTarget] = useState<AssignedSection | null>(null);

  const sectionsQuery = useAssignedSections({
    paperId,
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: open && !!paperId },
  });

  const rawSections = sectionsQuery.data?.result?.items ?? [];
  const tree = buildTree(rawSections);
  const totalCount =
    sectionsQuery.data?.result?.paging?.totalCount ?? rawSections.length;

  const handleClose = () => {
    setAssignTarget(null);
    setViewTarget(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'fixed top-[50%] left-[50%] z-50 flex h-[90vh] w-[90vw] max-w-4xl -translate-x-[50%] -translate-y-[50%] flex-col overflow-hidden rounded-xl shadow-2xl',
          )}
        >
          <Dialog.Close
            onClick={handleClose}
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {assignTarget ? (
            <AssignPanel
              section={assignTarget}
              paperId={paperId}
              subProjectId={subProjectId}
              onBack={() => setAssignTarget(null)}
              onAssigned={() => setAssignTarget(null)}
            />
          ) : viewTarget ? (
            <ViewMembersPanel
              section={viewTarget}
              paperId={paperId}
              isAuthor={isAuthor}
              onBack={() => setViewTarget(null)}
            />
          ) : (
            <>
              <div className="border-border bg-muted/30 border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Layers className="text-primary h-5 w-5" />
                  </div>
                  <Dialog.Title className="text-foreground text-lg font-semibold">
                    Assigned Sections
                  </Dialog.Title>
                </div>
                {!sectionsQuery.isLoading && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    {totalCount} section{totalCount !== 1 ? 's' : ''} assigned
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {sectionsQuery.isLoading ? (
                  <div className="space-y-2 p-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : sectionsQuery.isError ? (
                  <div className="py-16 text-center">
                    <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p className="text-muted-foreground text-sm font-medium">
                      No sections have been assigned to you.
                    </p>
                  </div>
                ) : tree.length === 0 ? (
                  <div className="py-16 text-center">
                    <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p className="text-muted-foreground text-sm font-medium">
                      No sections assigned yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                          <TableHead className="w-8 text-center font-semibold text-green-900 dark:text-green-200">
                            #
                          </TableHead>
                          <TableHead className="font-semibold text-green-900 dark:text-green-200">
                            Section Title
                          </TableHead>
                          {isAuthor && (
                            <TableHead className="w-52 text-right font-semibold text-green-900 dark:text-green-200">
                              Action
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flattenTree(tree).map(
                          ({ node, depth, label }, idx) => {
                            const isParent = depth === 0;
                            const isLeaf = node.children.length === 0;
                            return (
                              <TableRow
                                key={node.id}
                                className={cn(
                                  'transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20',
                                  idx % 2 === 0
                                    ? 'bg-white dark:bg-transparent'
                                    : 'bg-slate-50/50 dark:bg-slate-900/20',
                                )}
                              >
                                <TableCell className="text-muted-foreground text-center text-xs">
                                  {node.numbered ? label : '—'}
                                </TableCell>
                                <TableCell>
                                  <div
                                    className="flex items-center gap-2"
                                    style={{ paddingLeft: `${depth * 20}px` }}
                                  >
                                    {depth > 0 && (
                                      <ChevronRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                    )}
                                    {depth === 0 && (
                                      <Layers className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span
                                      className={cn(
                                        'leading-snug',
                                        isParent
                                          ? 'text-foreground text-sm font-semibold'
                                          : 'text-foreground text-xs font-medium',
                                      )}
                                    >
                                      {stripLatex(node.title)}
                                    </span>
                                  </div>
                                </TableCell>
                                {isAuthor && (
                                  <TableCell className="text-right">
                                    {isLeaf && (
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setViewTarget(node)}
                                          className={cn(
                                            'flex h-7 items-center gap-1 px-2 text-xs',
                                            BTN.VIEW_OUTLINE,
                                          )}
                                        >
                                          <Users className="h-3 w-3" />
                                          Members
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setAssignTarget(node)}
                                          className={cn(
                                            'flex h-7 items-center gap-1 px-2 text-xs',
                                            BTN.EDIT_OUTLINE,
                                          )}
                                        >
                                          <UserPlus className="h-3 w-3" />
                                          Assign
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          },
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
