import { useEffect, useMemo, useState } from 'react';
import {
  Layers,
  UserPlus,
  ArrowLeft,
  Check,
  Loader2,
  ChevronDown,
  Users,
  Trash2,
  Pencil,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { useQueryClient } from '@tanstack/react-query';

import { useGroups } from '@/features/group-role-management/api/get-groups';
import { LatexPaperEditor } from '@/features/project-management/components/papers/latex-paper-editor';

import { useAssignedSections } from '../api/get-assigned-sections';
import { useGetPaperSections } from '../api/get-paper-sections';
import { useCreatePaperContributor } from '../api/create-paper-contributor';
import { useAvailableSectionMembers } from '../api/get-available-section-members';
import { useGetSectionMembers } from '../api/get-section-members';
import { useDeletePaperContributor } from '../api/delete-paper-contributor';
import { useUpdatePaperContributor } from '../api/update-paper-contributor';
import { getMarkSection } from '../api/get-mark-section';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '../constants';
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

const getSectionPriority = (section: AssignedSection): number => {
  if (section.id === section.markSectionId) return 0;
  if (section.sectionRole === 'paper:author') return 1;
  if (section.sectionRole === 'section:edit') return 2;
  return 3;
};

const dedupeSectionsForList = (
  sections: AssignedSection[],
): AssignedSection[] => {
  const grouped = new Map<string, AssignedSection>();

  sections.forEach((section) => {
    const groupKey = section.markSectionId || section.id;
    const current = grouped.get(groupKey);
    if (!current) {
      grouped.set(groupKey, section);
      return;
    }

    const currentPriority = getSectionPriority(current);
    const nextPriority = getSectionPriority(section);
    if (nextPriority < currentPriority) {
      grouped.set(groupKey, section);
    }
  });

  return Array.from(grouped.values());
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
          className="h-8 w-32.5 justify-between px-2 text-xs capitalize"
        >
          {selectedLabel}
          <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-32.5 p-1">
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
                  'hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-xs capitalize outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
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
      memberIds: [selectedMember.memberId],
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
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : filtered.length === 0 ? (
            <div className="bg-muted/30 rounded-xl py-10 text-center">
              <p className="text-muted-foreground text-sm">No members found</p>
            </div>
          ) : (
            filtered.map((m) => {
              const isSelected = selectedMember?.memberId === m.memberId;
              return (
                <div
                  key={m.memberId}
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    isSelected
                      ? 'border-blue-400 bg-blue-50 shadow-sm dark:bg-blue-950/30'
                      : 'border-border hover:border-blue-300 hover:shadow-sm',
                  )}
                >
                  {/* Member row */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMember(null);
                        setSelectedRole('');
                      } else {
                        setSelectedMember(m);
                        setSelectedRole('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isSelected) {
                          setSelectedMember(null);
                          setSelectedRole('');
                        } else {
                          setSelectedMember(m);
                          setSelectedRole('');
                        }
                      }
                    }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase transition-colors',
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

                  {/* Role pill selector — shown inline when member is selected */}
                  {isSelected && (
                    <div
                      className="border-t border-blue-200 px-4 pt-2 pb-3 dark:border-blue-800/50"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <p className="text-muted-foreground mb-2 text-xs font-medium">
                        Assign role
                      </p>
                      {groupsQuery.isLoading ? (
                        <div className="flex gap-2">
                          <Skeleton className="h-7 w-16 rounded-full" />
                          <Skeleton className="h-7 w-16 rounded-full" />
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {sectionGroups.map((g) => {
                            const rawLabel = g.name?.includes(':')
                              ? g.name.split(':').pop()!
                              : g.name!;
                            const label =
                              rawLabel.charAt(0).toUpperCase() +
                              rawLabel.slice(1);
                            const isActive = selectedRole === g.name;
                            const isEdit =
                              rawLabel.toLowerCase() === 'edit' ||
                              rawLabel.toLowerCase() === 'author';
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() =>
                                  setSelectedRole(isActive ? '' : g.name!)
                                }
                                className={cn(
                                  'flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150',
                                  isActive
                                    ? isEdit
                                      ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                                      : 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                    : isEdit
                                      ? 'border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-blue-600'
                                      : 'border-border bg-background text-muted-foreground hover:border-emerald-300 hover:text-emerald-600',
                                )}
                              >
                                {isActive && (
                                  <Check className="h-3 w-3 shrink-0" />
                                )}
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
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
  const getSectionRolePriority = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized.includes('author')) return 0;
    if (normalized.includes('edit')) return 1;
    if (normalized.includes('read')) return 2;
    return 3;
  };
  const sortedMembers = [...members].sort(
    (a, b) =>
      getSectionRolePriority(a.sectionRole) -
      getSectionRolePriority(b.sectionRole),
  );

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
            <div className="min-h-100 overflow-x-auto rounded-xl border shadow-sm">
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
                      <TableHead className="w-36 text-center font-semibold text-green-900 dark:text-green-200">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((m, idx) => {
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
                          <TableCell className="text-center">
                            {!isProjectRole &&
                              (editingId === m.id ? (
                                <div className="flex items-center justify-center gap-1">
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
  projectId?: string;
  subProjectId: string;
  isAuthor?: boolean;
  isManager?: boolean;
};

export const PaperSectionsManager = ({
  paperId,
  paperTitle: _paperTitle,
  projectId,
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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();

  const assignedSectionsQuery = useAssignedSections({
    paperId,
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: !!paperId && !isManager },
  });

  const allSectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: { enabled: !!paperId && !!isManager },
  });

  const rawSections = useMemo(() => {
    if (isManager) {
      return (allSectionsQuery.data?.result?.items || []).map(
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
      );
    }

    return assignedSectionsQuery.data?.result?.items ?? [];
  }, [
    isManager,
    allSectionsQuery.data?.result?.items,
    assignedSectionsQuery.data?.result?.items,
    paperId,
  ]);

  const isLoading = isManager
    ? allSectionsQuery.isLoading
    : assignedSectionsQuery.isLoading;

  const isError = isManager
    ? allSectionsQuery.isError
    : assignedSectionsQuery.isError;

  const displaySections = useMemo(
    () => dedupeSectionsForList(rawSections),
    [rawSections],
  );
  const tree = buildTree(displaySections);
  const markSectionIdsToPrefetch = useMemo(() => {
    const ids = new Set<string>();
    displaySections.forEach((section) => {
      ids.add(section.markSectionId || section.id);
    });

    return Array.from(ids);
  }, [displaySections]);

  useEffect(() => {
    if (markSectionIdsToPrefetch.length === 0) return;

    markSectionIdsToPrefetch.forEach((markSectionId) => {
      void queryClient.prefetchQuery({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION, markSectionId],
        queryFn: () => getMarkSection(markSectionId),
      });
    });
  }, [markSectionIdsToPrefetch, queryClient]);

  const totalCount = displaySections.length;

  useEffect(() => {
    if (displaySections.length > 0) {
      setSelectedSectionId((prev) => {
        if (prev && displaySections.some((s) => s.id === prev)) return prev;
        const sorted = [...displaySections].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
        return sorted[0]?.id ?? null;
      });
    }
  }, [displaySections]);

  const SECTION_STATUS_MAP: Record<number, { label: string; cls: string }> = {
    1: {
      label: 'Not started',
      cls: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400',
    },
    2: {
      label: 'In progress',
      cls: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
    },
    3: {
      label: 'In review',
      cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
    },
    4: {
      label: 'Completed',
      cls: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400',
    },
  };

  const getMemberCount = (markSectionId: string): number => {
    const data = queryClient.getQueryData([
      PAPER_MANAGEMENT_QUERY_KEYS.MARK_SECTION,
      markSectionId,
    ]) as any;
    return (data?.result?.items?.length as number) ?? 0;
  };

  const flatRows = flattenTree(tree);
  const selectedNode =
    flatRows.find((r) => r.node.id === selectedSectionId)?.node ?? null;

  return (
    <div className="border-border bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm">
      {!editingEditorMode && !viewingReadOnlyMode && (
        <div className="flex h-150">
          {/* ── Left sidebar ──────────────────────────────────────── */}
          <div className="border-border flex w-72 shrink-0 flex-col overflow-hidden border-r">
            <div className="border-border shrink-0 border-b px-4 py-3">
              <p className="text-foreground text-sm font-semibold">
                {isManager ? 'All Sections' : 'Assigned Sections'}
              </p>
              {!isLoading && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {totalCount} section{totalCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-1 p-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : isError ? (
                <div className="py-10 text-center">
                  <Layers className="text-muted-foreground mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-muted-foreground text-xs">
                    {isManager
                      ? 'Failed to load sections.'
                      : 'No sections assigned.'}
                  </p>
                </div>
              ) : flatRows.length === 0 ? (
                <div className="py-10 text-center">
                  <Layers className="text-muted-foreground mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-muted-foreground text-xs">
                    {isManager
                      ? 'No sections found.'
                      : 'No sections assigned yet'}
                  </p>
                </div>
              ) : (
                flatRows.map(({ node, depth }) => {
                  const isSelected = selectedSectionId === node.id;
                  const markSectionId = node.markSectionId || node.id;
                  const memberCount = getMemberCount(markSectionId);
                  const statusInfo =
                    node.status != null
                      ? SECTION_STATUS_MAP[node.status]
                      : null;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedSectionId(node.id)}
                      style={{ paddingLeft: `${16 + depth * 16}px` }}
                      className={cn(
                        'border-border hover:bg-muted/40 w-full border-b py-3 pr-4 text-left transition-colors',
                        isSelected && 'bg-muted/60',
                      )}
                    >
                      <p
                        className={cn(
                          'leading-snug',
                          depth === 0
                            ? 'text-foreground text-sm font-semibold'
                            : 'text-foreground text-xs font-medium',
                        )}
                      >
                        {stripLatex(node.title)}
                      </p>
                      {(statusInfo || memberCount > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {statusInfo && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-5 rounded-full px-1.5 py-0 text-[10px]',
                                statusInfo.cls,
                              )}
                            >
                              {statusInfo.label}
                            </Badge>
                          )}
                          {memberCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                              {memberCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right content panel ───────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!selectedNode ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Select a section to view details
                </p>
              </div>
            ) : (
              <>
                {/* Action buttons row */}
                <div className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
                  <Button size="sm" className="h-8 px-3 text-xs font-semibold">
                    Pickbest
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInitialEditSectionId(selectedNode.id);
                      setViewingReadOnlyMode(true);
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    View
                  </Button>
                  {isAuthor && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setActiveDialog({ type: 'view', section: selectedNode })
                      }
                      className="h-8 px-3 text-xs"
                    >
                      Writer
                    </Button>
                  )}
                  {(selectedNode.sectionRole === 'paper:author' ||
                    selectedNode.sectionRole === 'section:edit') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInitialEditSectionId(selectedNode.id);
                        setEditingEditorMode(true);
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {/* Main idea content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <p className="text-foreground mb-3 text-base font-medium">
                    Main Idea
                  </p>
                  <div className="border-border bg-background min-h-64 rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {(selectedNode as any).mainIdea ||
                      selectedNode.description ||
                      selectedNode.sectionSumary ||
                      ''}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Members dialog ────────────────────────────────────── */}
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
        </div>
      )}

      {editingEditorMode && (
        <LatexPaperEditor
          paperTitle={_paperTitle}
          projectId={projectId}
          sections={
            editTargetItem
              ? [
                  {
                    id: editTargetItem.sectionId,
                    markSectionId: editTargetItem.markSectionId,
                    paperId,
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
                  markSectionId: node.markSectionId,
                  paperId: node.paperId,
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
            void assignedSectionsQuery.refetch();
            void allSectionsQuery.refetch();
          }}
        />
      )}

      {viewingReadOnlyMode && (
        <LatexPaperEditor
          readOnly={true}
          paperTitle={_paperTitle}
          projectId={projectId}
          sections={
            editTargetItem
              ? [
                  {
                    id: editTargetItem.sectionId,
                    markSectionId: editTargetItem.markSectionId,
                    paperId,
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
                  markSectionId: node.markSectionId,
                  paperId: node.paperId,
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
            void assignedSectionsQuery.refetch();
            void allSectionsQuery.refetch();
          }}
        />
      )}
    </div>
  );
};
