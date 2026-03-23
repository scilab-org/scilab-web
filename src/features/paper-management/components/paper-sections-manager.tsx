import { useState } from 'react';
import {
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
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { LatexPaperEditor } from '@/features/project-management/components/papers/latex-paper-editor';

import { useAssignedSections } from '../api/get-assigned-sections';
import { useGetPaperSections } from '../api/get-paper-sections';
import { useCreatePaperContributor } from '../api/create-paper-contributor';
import { useAvailableSectionMembers } from '../api/get-available-section-members';
import { useGetSectionMembers } from '../api/get-section-members';
import { useDeletePaperContributor } from '../api/delete-paper-contributor';
import { useUpdatePaperContributor } from '../api/update-paper-contributor';
import { useMarkSection } from '../api/get-mark-section';
import {
  AssignedSection,
  AvailableSectionMember,
  SectionMember,
  MarkSectionItem,
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

// ─── Role Selector Component ──────────────────────────────────────────────────

const RoleSelector = ({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options
      .find((o) => o.name === value)
      ?.name?.split(':')
      .pop() ||
    value.split(':').pop() ||
    'Select Role';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className="h-8 w-[130px] justify-between px-2 text-xs capitalize"
        >
          {selectedLabel}
          <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[130px] p-1">
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const label = option.name?.split(':').pop();
            const isSelected = value === option.name;
            return (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                }}
                className={cn(
                  'hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-xs capitalize outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  isSelected && 'bg-accent text-accent-foreground',
                )}
              >
                {label}
                {isSelected && (
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
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
      sectionId: section.id,
      markSectionId: section.id,
      memberId: selectedMember.memberId,
      sectionRole: selectedRole,
    });
  };

  const canSubmit =
    !!selectedMember && !!selectedRole && !assignMutation.isPending;

  return (
    <div className="bg-background flex h-[80vh] flex-col rounded-lg border shadow-sm">
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
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          ) : sectionGroups.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No section roles available
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sectionGroups.map((g) => {
                const label = g.name?.includes(':')
                  ? g.name.split(':').pop()!
                  : g.name!;
                const isActive = selectedRole === g.name;
                const isEdit =
                  label.toLowerCase() === 'edit' ||
                  label.toLowerCase() === 'author';
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedRole(isActive ? '' : g.name!)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all',
                      isActive
                        ? isEdit
                          ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                          : 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:border-blue-300',
                    )}
                  >
                    {isActive ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isEdit ? (
                      <Pencil className="h-3.5 w-3.5" />
                    ) : (
                      <Users className="h-3.5 w-3.5" />
                    )}
                    {label}
                  </button>
                );
              })}
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

// ─── Section Expanded View ───────────────────────────────────────────────────

const SectionExpandedView = ({
  markSectionId,
  excludeSectionId,
  isAuthor,
  onEditSection,
  onViewSection,
}: {
  markSectionId: string;
  excludeSectionId: string;
  isAuthor?: boolean;
  onEditSection?: (item: MarkSectionItem) => void;
  onViewSection?: (item: MarkSectionItem) => void;
}) => {
  const query = useMarkSection({ markSectionId });

  if (query.isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  const items = query.data?.result?.items ?? [];
  const sorted = [...items]
    .filter((item) => item.sectionId !== excludeSectionId)
    .sort((a, b) =>
      a.isMainSection === b.isMainSection ? 0 : a.isMainSection ? -1 : 1,
    );

  if (sorted.length === 0) {
    return (
      <div className="text-muted-foreground px-3 py-2 text-center text-xs">
        No other versions
      </div>
    );
  }

  return (
    <div className="divide-y divide-blue-100 dark:divide-blue-900/30">
      {sorted.map((item) => {
        const initials = item.name
          ? item.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : '?';
        return (
          <div
            key={item.sectionId}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-blue-100/40 dark:hover:bg-blue-900/20"
          >
            {/* Avatar */}
            <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
              {initials}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-foreground truncate text-xs font-medium">
                  {item.name}
                </span>
                {item.isMainSection && (
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    main
                  </span>
                )}
              </div>
              <p className="text-muted-foreground truncate text-[10px]">
                {stripLatex(item.title)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {isAuthor && onEditSection && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditSection(item)}
                  className="h-6 w-6 rounded-full p-0"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onViewSection && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewSection(item)}
                  className="h-6 w-6 rounded-full p-0"
                  title="View"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── View Members Panel ───────────────────────────────────────────────────────

type ViewMembersPanelProps = {
  section: AssignedSection;
  paperId: string;
  isAuthor: boolean;
  onBack: () => void;
  onAssign?: () => void;
};

const ViewMembersPanel = ({
  section,
  paperId,
  isAuthor,
  onBack,
  onAssign,
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
    <div className="bg-background flex h-[80vh] flex-col rounded-lg border shadow-sm">
      <div className="border-border flex shrink-0 items-center gap-3 border-b px-6 py-4">
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {onAssign && (
          <div className="mb-0 flex shrink-0 justify-end px-6 py-4 pb-0">
            <Button
              size="sm"
              onClick={onAssign}
              className={cn('flex items-center gap-2', BTN.CREATE)}
            >
              <UserPlus className="h-4 w-4" />
              Assign Member
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-6">
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
                    const isProjectRole =
                      m.sectionRole.startsWith('project:') ||
                      m.sectionRole.startsWith('paper:');
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
                            <RoleSelector
                              value={editingRole || m.sectionRole}
                              onChange={setEditingRole}
                              options={sectionGroups.map((g) => ({
                                id: g.id || g.name!,
                                name: g.name!,
                              }))}
                            />
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
                                    className={cn(
                                      'h-7 px-2 text-xs',
                                      BTN.CANCEL,
                                    )}
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
      </div>

      <div className="border-border flex shrink-0 items-center justify-end border-t px-6 py-4">
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

// ─── Main Component ──────────────────────────────────────────────────────────────

export type PaperSectionsManagerProps = {
  paperId: string;
  paperTitle: string;
  subProjectId: string;
  isAuthor?: boolean;
  isManager?: boolean;
};

export const PaperSectionsManager = ({
  paperId,
  paperTitle: _paperTitle,
  subProjectId,
  isAuthor = false,
  isManager = false,
}: PaperSectionsManagerProps) => {
  const [activeDialog, setActiveDialog] = useState<{
    type: 'view' | 'assign';
    section: AssignedSection;
  } | null>(null);

  const [editingEditorMode, setEditingEditorMode] = useState<boolean>(false);
  const [viewingReadOnlyMode, setViewingReadOnlyMode] =
    useState<boolean>(false);
  const [initialEditSectionId, setInitialEditSectionId] = useState<
    string | null
  >(null);
  const [editTargetItem, setEditTargetItem] = useState<MarkSectionItem | null>(
    null,
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const toggleExpand = (id: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const assignedSectionsQuery = useAssignedSections({
    paperId,
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: !!paperId && !isManager },
  });

  const allSectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: { enabled: !!paperId && !!isManager },
  });

  const rawSections = isManager
    ? (allSectionsQuery.data?.result?.items || []).map(
        (s) =>
          ({
            ...s,
            paperId: s.paperId || paperId,
            markSectionId: '',
            paperContributorId: '',
            memberId: '',
            sectionRole: 'project:manager',
            filePath: s.filePath || null,
            parentSectionId: s.parentSectionId || null,
            sectionSumary: s.sectionSumary || '',
            description:
              (s as any).description ||
              (s as any).Description ||
              s.sectionSumary ||
              (s as any).sectionSummary ||
              (s as any).SectionSummary ||
              '',
            content: s.content || '',
            numbered: s.numbered,
            displayOrder: s.displayOrder,
          }) as AssignedSection,
      )
    : (assignedSectionsQuery.data?.result?.items ?? []);

  const isLoading = isManager
    ? allSectionsQuery.isLoading
    : assignedSectionsQuery.isLoading;

  const isError = isManager
    ? allSectionsQuery.isError
    : assignedSectionsQuery.isError;

  const tree = buildTree(rawSections);
  const totalCount =
    (isManager
      ? rawSections.length
      : assignedSectionsQuery.data?.result?.paging?.totalCount) ??
    rawSections.length;

  return (
    <div className="border-border bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm">
      {!editingEditorMode && !viewingReadOnlyMode && (
        <>
          <div className="border-border bg-muted/30 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Layers className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">
                {isManager ? 'All Sections' : 'Assigned Sections'}
              </h3>
            </div>
            {!isLoading && (
              <p className="text-muted-foreground mt-3 text-sm">
                {totalCount} section{totalCount !== 1 ? 's' : ''}{' '}
                {isManager ? 'in total' : 'assigned'}
              </p>
            )}
          </div>

          <div className="bg-background overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 p-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isError ? (
              <div className="py-16 text-center">
                <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
                <p className="text-muted-foreground text-sm font-medium">
                  {isManager
                    ? 'Failed to load sections.'
                    : 'No sections have been assigned to you.'}
                </p>
              </div>
            ) : tree.length === 0 ? (
              <div className="py-16 text-center">
                <Layers className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-30" />
                <p className="text-muted-foreground text-sm font-medium">
                  {isManager
                    ? 'No sections found.'
                    : 'No sections assigned yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                      <TableHead className="w-8 text-center font-semibold text-green-900 dark:text-green-200">
                        #
                      </TableHead>
                      <TableHead className="font-semibold text-green-900 dark:text-green-200">
                        Section Title
                      </TableHead>
                      <TableHead className="w-52 text-right font-semibold text-green-900 dark:text-green-200">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flattenTree(tree).flatMap(
                      ({ node, depth, label }, idx) => {
                        const isParent = depth === 0;
                        const isLeaf = node.children.length === 0;
                        const canExpand =
                          node.sectionRole === 'section:edit' ||
                          (node.sectionRole === 'paper:author' &&
                            !!node.markSectionId);
                        const isExpanded = expandedSections.has(node.id);
                        const mainRow = (
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
                              {node.numbered
                                ? label
                                : node.children.length === 0
                                  ? '—'
                                  : ''}
                            </TableCell>
                            <TableCell>
                              <div
                                className="flex items-center gap-2"
                                style={{
                                  paddingLeft: `${depth * 20}px`,
                                }}
                              >
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
                                {canExpand && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(node.id)}
                                    className="text-muted-foreground hover:text-foreground ml-1 flex items-center gap-1 text-xs transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isLeaf && (
                                <div className="flex items-center justify-end gap-1">
                                  {isAuthor && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setActiveDialog({
                                          type: 'view',
                                          section: node,
                                        })
                                      }
                                      className={cn(
                                        'flex h-7 items-center gap-1 px-2 text-xs',
                                        BTN.VIEW_OUTLINE,
                                      )}
                                    >
                                      <Users className="h-3 w-3" />
                                      Members
                                    </Button>
                                  )}
                                  {(node.sectionRole === 'paper:author' ||
                                    node.sectionRole === 'section:edit') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setInitialEditSectionId(node.id);
                                        setEditingEditorMode(true);
                                      }}
                                      className={cn(
                                        'flex h-7 items-center gap-1 px-2 text-xs',
                                        BTN.EDIT_OUTLINE,
                                      )}
                                    >
                                      <Pencil className="h-3 w-3" />
                                      Edit
                                    </Button>
                                  )}
                                  {(node.sectionRole === 'section:read' ||
                                    node.sectionRole === 'project:manager') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setInitialEditSectionId(node.id);
                                        setViewingReadOnlyMode(true);
                                      }}
                                      className={cn(
                                        'flex h-7 items-center gap-1 px-2 text-xs',
                                        BTN.VIEW_OUTLINE,
                                      )}
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                        if (!canExpand || !isExpanded) return [mainRow];
                        const subRow = (
                          <TableRow
                            key={`${node.id}-contributors`}
                            className="hover:bg-transparent"
                          >
                            <TableCell colSpan={3} className="p-0">
                              <div className="border-t border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
                                <SectionExpandedView
                                  markSectionId={node.markSectionId || node.id}
                                  excludeSectionId={node.id}
                                  isAuthor={isAuthor}
                                  onEditSection={
                                    isAuthor
                                      ? (item) => {
                                          setEditTargetItem(item);
                                          setEditingEditorMode(true);
                                        }
                                      : undefined
                                  }
                                  onViewSection={(item) => {
                                    setEditTargetItem(item);
                                    setViewingReadOnlyMode(true);
                                  }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                        return [mainRow, subRow];
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Dialog
            open={!!activeDialog}
            onOpenChange={(open) => !open && setActiveDialog(null)}
          >
            <DialogContent className="max-w-4xl overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-5xl">
              {activeDialog &&
                (activeDialog.type === 'assign' ? (
                  <AssignPanel
                    section={activeDialog.section}
                    paperId={paperId}
                    subProjectId={subProjectId}
                    onBack={() =>
                      setActiveDialog({
                        type: 'view',
                        section: activeDialog.section,
                      })
                    }
                    onAssigned={() =>
                      setActiveDialog({
                        type: 'view',
                        section: activeDialog.section,
                      })
                    }
                  />
                ) : (
                  <ViewMembersPanel
                    section={activeDialog.section}
                    paperId={paperId}
                    isAuthor={isAuthor}
                    onBack={() => setActiveDialog(null)}
                    onAssign={
                      isAuthor
                        ? () =>
                            setActiveDialog({
                              type: 'assign',
                              section: activeDialog.section,
                            })
                        : undefined
                    }
                  />
                ))}
            </DialogContent>
          </Dialog>
        </>
      )}

      {editingEditorMode && (
        <LatexPaperEditor
          paperTitle={_paperTitle}
          sections={
            editTargetItem
              ? [
                  {
                    id: editTargetItem.sectionId,
                    title: stripLatex(editTargetItem.title),
                    content: editTargetItem.content || '',
                    memberId: editTargetItem.memberId,
                    numbered: true,
                    sectionSumary: '',
                    parentSectionId: editTargetItem.parentSectionId,
                    sectionRole: editTargetItem.sectionRole,
                    description:
                      editTargetItem.description ||
                      (editTargetItem as any).Description ||
                      '',
                  },
                ]
              : flattenTree(tree).map(({ node }) => ({
                  id: node.id,
                  title: stripLatex(node.title),
                  content: node.content || '',
                  memberId: node.memberId,
                  numbered: node.numbered,
                  sectionSumary: node.sectionSumary || '',
                  parentSectionId: node.parentSectionId,
                  sectionRole: node.sectionRole,
                  description:
                    node.description ||
                    (node as any).Description ||
                    node.sectionSumary ||
                    (node as any).sectionSummary ||
                    (node as any).SectionSummary ||
                    '',
                }))
          }
          initialSectionId={
            editTargetItem
              ? editTargetItem.sectionId
              : initialEditSectionId || undefined
          }
          onClose={() => {
            setEditingEditorMode(false);
            setEditTargetItem(null);
          }}
        />
      )}

      {viewingReadOnlyMode && (
        <LatexPaperEditor
          readOnly={true}
          paperTitle={_paperTitle}
          sections={
            editTargetItem
              ? [
                  {
                    id: editTargetItem.sectionId,
                    title: stripLatex(editTargetItem.title),
                    content: editTargetItem.content || '',
                    memberId: editTargetItem.memberId,
                    numbered: true,
                    sectionSumary: '',
                    parentSectionId: editTargetItem.parentSectionId,
                    sectionRole: editTargetItem.sectionRole,
                    description:
                      editTargetItem.description ||
                      (editTargetItem as any).Description ||
                      '',
                  },
                ]
              : flattenTree(tree).map(({ node }) => ({
                  id: node.id,
                  title: stripLatex(node.title),
                  content: node.content || '',
                  memberId: node.memberId,
                  numbered: node.numbered,
                  sectionSumary: node.sectionSumary || '',
                  parentSectionId: node.parentSectionId,
                  sectionRole: node.sectionRole,
                  description:
                    node.description ||
                    (node as any).Description ||
                    node.sectionSumary ||
                    (node as any).sectionSummary ||
                    (node as any).SectionSummary ||
                    '',
                }))
          }
          initialSectionId={
            editTargetItem
              ? editTargetItem.sectionId
              : initialEditSectionId || undefined
          }
          onClose={() => {
            setViewingReadOnlyMode(false);
            setEditTargetItem(null);
          }}
        />
      )}
    </div>
  );
};
