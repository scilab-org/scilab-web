import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  Hash,
  LayoutList,
  Loader2,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { BTN } from '@/lib/button-styles';
import { cn } from '@/utils/cn';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { useAssignedSections } from '@/features/paper-management/api/get-assigned-sections';
import { getAssignedSections } from '@/features/paper-management/api/get-assigned-sections';
import { useGetPaperSections } from '@/features/paper-management/api/get-paper-sections';
import { getSection } from '@/features/paper-management/api/get-section';
import { useGetSectionMembers } from '@/features/paper-management/api/get-section-members';
import { useAvailableSectionMembers } from '@/features/paper-management/api/get-available-section-members';
import { useCreatePaperContributor } from '@/features/paper-management/api/create-paper-contributor';
import { useDeletePaperContributor } from '@/features/paper-management/api/delete-paper-contributor';
import { getPaperSectionsQueryOptions } from '@/features/paper-management/api/get-paper-sections';
import { PAPER_MANAGEMENT_QUERY_KEYS } from '@/features/paper-management/constants';
import {
  AssignedSection,
  AvailableSectionMember,
  PaperSection,
  SectionMember,
} from '@/features/paper-management/types';
import { MarkMainSectionDialog } from '@/features/paper-management/components/mark-main-section-dialog';
import { LatexPaperEditor } from '@/features/project-management/components/papers/latex-paper-editor';

const stripLatex = (input: string): string => {
  if (!input) return '(Untitled)';
  let s = input;
  const cmdPat = /\\[a-zA-Z*]+\{([^{}]*)\}/g;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(cmdPat, '$1');
  }
  return s.replace(/[{}]/g, '').trim() || '(Untitled)';
};

// Format description: convert literal \n to real newlines
const formatDesc = (text: string) =>
  text.replace(/\\n/g, '\n').replace(/  +/g, ' ').trim();

// ── Section Members Sheet ────────────────────────────────────────────────────
const SectionMembersSheet = ({
  sectionId,
  sectionTitle,
  paperId,
  open,
  onClose,
  isAuthor,
}: {
  sectionId: string;
  sectionTitle: string;
  paperId: string;
  open: boolean;
  onClose: () => void;
  isAuthor?: boolean;
}) => {
  const [view, setView] = useState<'members' | 'assign'>('members');

  // Members view state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Assign view state
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] =
    useState<AvailableSectionMember | null>(null);
  const [selectedRole, setSelectedRole] = useState('section:edit');

  const membersQuery = useGetSectionMembers({
    sectionId: open && sectionId ? sectionId : '',
    paperId,
  });
  const members: SectionMember[] = membersQuery.data?.result?.items ?? [];

  const availableQuery = useAvailableSectionMembers({
    sectionId: sectionId || '',
    paperId,
    queryConfig: { enabled: open && view === 'assign' && !!sectionId } as any,
  });
  const availableMembers: AvailableSectionMember[] =
    availableQuery.data?.result?.items ?? [];

  const getSectionRolePriority = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized.includes('author')) return 0;
    if (normalized.includes('edit')) return 1;
    if (normalized.includes('read') || normalized.includes('view')) return 2;
    return 3;
  };
  const sortedMembers = [...members].sort(
    (a, b) =>
      getSectionRolePriority(a.sectionRole) -
      getSectionRolePriority(b.sectionRole),
  );

  const filtered = availableMembers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.email?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    );
  });

  const deleteMutation = useDeletePaperContributor({
    sectionId,
    paperId,
    mutationConfig: {
      onSuccess: () => toast.success('Member removed successfully'),
      onError: () => toast.error('Failed to remove member'),
    },
  });

  const assignMutation = useCreatePaperContributor({
    paperId,
    mutationConfig: {
      onSuccess: () => {
        toast.success('Member assigned successfully');
        setView('members');
        setSelectedMember(null);
        setSelectedRole('section:edit');
        setSearch('');
      },
      onError: () => toast.error('Failed to assign member'),
    },
  });

  const handleAssign = () => {
    if (!selectedMember) return;
    assignMutation.mutate({
      paperId,
      sectionId,
      markSectionId: sectionId,
      memberId: selectedMember.memberId,
      sectionRole: selectedRole,
    });
  };

  const canSubmit = !!selectedMember && !assignMutation.isPending;

  const handleClose = () => {
    setView('members');
    setConfirmDeleteId(null);
    setSelectedMember(null);
    setSelectedRole('section:edit');
    setSearch('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {view === 'assign' && (
              <button
                onClick={() => setView('members')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <Users className="size-5 text-green-600" />
            {view === 'assign' ? 'Assign Member' : 'Section Members'}
          </SheetTitle>
          <SheetDescription className="truncate text-xs">
            {sectionTitle}
          </SheetDescription>
        </SheetHeader>

        {view === 'members' ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {isAuthor && (
              <div className="flex justify-end pt-2 pb-3">
                <Button
                  size="sm"
                  onClick={() => setView('assign')}
                  className={cn('flex items-center gap-2', BTN.CREATE)}
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Member
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {membersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
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
                        <TableHead className="w-44 font-semibold text-green-900 dark:text-green-200">
                          Role
                        </TableHead>
                        {isAuthor && (
                          <TableHead className="w-28 text-right font-semibold text-green-900 dark:text-green-200">
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
                        const displayRole = (() => {
                          const raw = m.sectionRole.includes(':')
                            ? m.sectionRole.split(':').pop()
                            : m.sectionRole;
                          if (raw === 'edit') return 'Editor';
                          if (raw === 'read' || raw === 'view') return 'Viewer';
                          if (raw === 'author') return 'Author';
                          if (raw === 'manager') return 'Manager';
                          return raw
                            ? raw.charAt(0).toUpperCase() + raw.slice(1)
                            : raw;
                        })();
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
                            </TableCell>
                            {isAuthor && (
                              <TableCell className="text-right">
                                {!isProjectRole && (
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
                                )}
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
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-2">
              <div className="space-y-2">
                <p className="text-foreground text-sm font-medium">
                  Select Member
                </p>
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
                {availableQuery.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </>
                ) : filtered.length === 0 ? (
                  <div className="bg-muted/30 rounded-xl py-10 text-center">
                    <p className="text-muted-foreground text-sm">
                      No members found
                    </p>
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
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMember(null);
                              setSelectedRole('');
                            } else {
                              setSelectedMember(m);
                              setSelectedRole('section:edit');
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
                                setSelectedRole('section:edit');
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
                        {isSelected && (
                          <div
                            className="border-t border-blue-200 px-4 py-2 dark:border-blue-800/50"
                            role="presentation"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                Role:
                              </span>
                              <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                Editor
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setView('members')}
                className={BTN.CANCEL}
              >
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
        )}

        <AlertDialog
          open={!!confirmDeleteId}
          onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove member?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this member from the section?
                This action cannot be undone.
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
      </SheetContent>
    </Sheet>
  );
};

type EditorState = { initialSectionId: string; readOnly: boolean } | null;

export const PaperWorkspacePage = ({
  projectId,
  paperId,
  isManager = false,
  isAuthor = false,
  backPath,
}: {
  projectId: string;
  paperId: string;
  isManager?: boolean;
  isAuthor?: boolean;
  backPath: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editorState, setEditorState] = useState<EditorState>(null);
  const [freshSections, setFreshSections] = useState<PaperSection[] | null>(
    null,
  );
  const [memberSheet, setMemberSheet] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [markMainOpen, setMarkMainOpen] = useState(false);

  const paperQuery = useWritingPaperDetail({ paperId });

  // Always fetch all sections so every assigned member can see the full paper
  const allSectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: { enabled: !!paperId },
  });

  // For non-managers: also fetch the sections the current user is specifically assigned to
  const assignedSectionsQuery = useAssignedSections({
    paperId,
    params: { PageNumber: 1, PageSize: 1000 },
    queryConfig: { enabled: !!paperId && !isManager },
  });

  // Build a lookup map from assigned-sections keyed by both id and markSectionId
  const assignedByIdMap = useMemo<Map<string, AssignedSection>>(() => {
    const items = assignedSectionsQuery.data?.result?.items ?? [];
    const map = new Map<string, AssignedSection>();
    items.forEach((s) => {
      map.set(s.id, s);
      if (s.markSectionId) map.set(s.markSectionId, s);
    });
    return map;
  }, [assignedSectionsQuery.data]);

  // IDs of sections where this user has edit rights (for renderSectionCard)
  const editableSectionIds = useMemo<Set<string>>(() => {
    const items = assignedSectionsQuery.data?.result?.items ?? [];
    const ids = new Set<string>();
    items
      .filter(
        (s) =>
          s.sectionRole === 'section:edit' ||
          s.sectionRole === 'paper:author' ||
          s.sectionRole === 'project:manager',
      )
      .forEach((s) => {
        if (s.id) ids.add(s.id);
        if (s.markSectionId) ids.add(s.markSectionId);
      });
    return ids;
  }, [assignedSectionsQuery.data]);

  const workspaceSections = useMemo(() => {
    const allItems =
      freshSections ?? allSectionsQuery.data?.result?.items ?? [];

    // Managers: all sections editable
    if (isManager) {
      return allItems.map(
        (s) =>
          ({
            ...s,
            paperId: s.paperId || paperId,
            // markSectionId must be stable and non-empty for version-id resolution.
            // When not provided by backend for managers, fallback to the current id.
            markSectionId: s.id,
            paperContributorId: '',
            memberId: '',
            sectionRole: 'project:manager',
            filePath: s.filePath || null,
            parentSectionId: s.parentSectionId || null,
            sectionSumary: s.sectionSumary || '',
            description: (s as any).description || s.sectionSumary || '',
            content: s.content || '',
            numbered: s.numbered,
            displayOrder: s.displayOrder,
          }) as AssignedSection,
      );
    }

    // Authors and members: show all sections but use assigned data when available;
    // sections not in assigned-sections are view-only
    return allItems.map((s) => {
      const assigned = assignedByIdMap.get(s.id);
      if (assigned) {
        return {
          // Always trust latest section payload for content/title/structure.
          // Assigned payload is used only for permission and member metadata.
          ...s,
          paperId: s.paperId || assigned.paperId || paperId,
          markSectionId: assigned.markSectionId || '',
          paperContributorId: assigned.paperContributorId || '',
          memberId: assigned.memberId || '',
          sectionRole: assigned.sectionRole || 'section:view',
          filePath: s.filePath || null,
          parentSectionId: s.parentSectionId || null,
          sectionSumary: s.sectionSumary || '',
          description: (assigned as any).description || s.sectionSumary || '',
          content: s.content || '',
          numbered: s.numbered,
          displayOrder: s.displayOrder,
        } as AssignedSection;
      }
      return {
        ...s,
        paperId: s.paperId || paperId,
        // Ensure non-empty markSectionId so editor can resolve newest version id via assigned-sections.
        markSectionId: s.id,
        paperContributorId: '',
        memberId: '',
        sectionRole: 'section:view',
        filePath: s.filePath || null,
        parentSectionId: s.parentSectionId || null,
        sectionSumary: s.sectionSumary || '',
        description: (s as any).description || s.sectionSumary || '',
        content: s.content || '',
        numbered: s.numbered,
        displayOrder: s.displayOrder,
      } as AssignedSection;
    });
  }, [
    freshSections,
    isManager,
    assignedByIdMap,
    allSectionsQuery.data,
    paperId,
  ]);

  const paper = paperQuery.data?.result?.paper;
  const subProjectId = paper?.subProjectId || projectId;

  const isLoading =
    paperQuery.isLoading ||
    allSectionsQuery.isLoading ||
    (!isManager && assignedSectionsQuery.isLoading);

  const editorSections = useMemo(
    () =>
      workspaceSections.map((s) => ({
        id: s.id,
        markSectionId: s.markSectionId || s.id,
        paperId: s.paperId,
        title: stripLatex(s.title),
        content: s.content || '',
        memberId: s.memberId,
        numbered: s.numbered,
        displayOrder: s.displayOrder,
        sectionSumary: s.sectionSumary || '',
        parentSectionId: s.parentSectionId,
        sectionRole: s.sectionRole,
        description: (s as any).description || s.sectionSumary || '',
        createdOnUtc: s.createdOnUtc || null,
        lastModifiedOnUtc: s.lastModifiedOnUtc || null,
      })),
    [workspaceSections],
  );

  const resolvedInitialSectionId = useMemo(() => {
    if (!editorState) return undefined;

    const sectionExists = editorSections.some(
      (s) => s.id === editorState.initialSectionId,
    );
    if (sectionExists) return editorState.initialSectionId;

    return editorSections[0]?.id;
  }, [editorSections, editorState]);

  // Compute sequential numbers for numbered sections
  const sectionNumbers = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = (arr: typeof editorSections) =>
      [...arr].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const roots = sorted(editorSections.filter((s) => !s.parentSectionId));
    let rootCount = 0;
    roots.forEach((root) => {
      if (root.numbered) rootCount++;
      const rootNum = root.numbered ? `${rootCount}` : '';
      if (rootNum) map.set(root.id, rootNum);
      const children = sorted(
        editorSections.filter((s) => s.parentSectionId === root.id),
      );
      let childCount = 0;
      children.forEach((child) => {
        if (child.numbered) childCount++;
        if (child.numbered)
          map.set(
            child.id,
            rootNum ? `${rootNum}.${childCount}` : `${childCount}`,
          );
      });
    });
    return map;
  }, [editorSections]);

  const openSectionEditor = async (sectionId: string, readOnly: boolean) => {
    let resolvedSectionId = sectionId;

    // Always resolve the latest section id from assigned-sections.
    // Reason: backend may version sections (id changes) after updates; using the workspace id
    // can lead to loading stale/previous versions.
    try {
      const assignedResponse = await getAssignedSections({
        paperId,
        params: { PageNumber: 1, PageSize: 1000 },
      });
      const assignedItems = assignedResponse.result?.items ?? [];

      const workspaceSection = editorSections.find((s) => s.id === sectionId);
      const markSectionId = workspaceSection?.markSectionId || sectionId;

      const exactMatch = assignedItems.find((item) => item.id === sectionId);
      const markMatch = assignedItems.find(
        (item) => (item.markSectionId || item.id) === markSectionId,
      );

      resolvedSectionId = exactMatch?.id || markMatch?.id || sectionId;
    } catch {
      resolvedSectionId = sectionId;
    }

    try {
      const response = await getSection(resolvedSectionId);
      const latestSection = response.result;

      setFreshSections((prev) => {
        const baseSections = prev ?? allSectionsQuery.data?.result?.items ?? [];
        if (baseSections.length === 0) return prev;

        return baseSections.map((section) =>
          section.id === sectionId || section.id === resolvedSectionId
            ? {
                ...section,
                id: latestSection.id || resolvedSectionId,
                title: latestSection.title,
                content: latestSection.content,
                numbered: latestSection.numbered,
                displayOrder: latestSection.displayOrder,
                sectionSumary: latestSection.sectionSumary,
                parentSectionId: latestSection.parentSectionId,
              }
            : section,
        );
      });
    } catch {
      // Open the editor even if the section fetch fails; it will use current data.
    }

    setEditorState({ initialSectionId: resolvedSectionId, readOnly });
  };

  const handleEditorSave = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_SECTIONS, paperId],
      });
      const response = await queryClient.fetchQuery(
        getPaperSectionsQueryOptions(paperId),
      );
      setFreshSections(response.result.items);
    } catch {
      // Keep the current snapshot if refresh fails.
    }
  };

  // If editor is open, render it (fixed inset-0, overlays everything)
  if (editorState) {
    return (
      <LatexPaperEditor
        readOnly={editorState.readOnly}
        paperTitle={paper?.title || 'Untitled'}
        projectId={projectId}
        sections={editorSections}
        initialSectionId={resolvedInitialSectionId}
        onSave={handleEditorSave}
        onClose={() => {
          setEditorState(null);
          setFreshSections(null);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <ContentLayout title="Workspace">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </ContentLayout>
    );
  }

  if (!paper) {
    return (
      <ContentLayout title="Workspace">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Paper not found</p>
          <Button onClick={() => navigate(backPath)} className="mt-4">
            Go Back
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const canEditSection = (role: string) =>
    role === 'section:edit' ||
    role === 'paper:author' ||
    role === 'project:manager';

  // Group by parent for display
  const rootSections = editorSections.filter((s) => !s.parentSectionId);
  const childSections = (parentId: string) =>
    editorSections.filter((s) => s.parentSectionId === parentId);

  const renderSectionCard = (
    s: (typeof editorSections)[0],
    isChild = false,
  ) => {
    const canEdit =
      canEditSection(s.sectionRole || '') ||
      editableSectionIds.has(s.id) ||
      editableSectionIds.has(s.markSectionId || '');
    const num = sectionNumbers.get(s.id);
    return (
      <div
        key={s.id}
        className={cn(
          'bg-card rounded-xl border transition-shadow hover:shadow-md',
          isChild
            ? 'ml-6 border-l-2 border-l-blue-200 dark:border-l-blue-800'
            : 'border-border shadow-sm',
        )}
      >
        <div className="flex items-start gap-4 p-5">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              canEdit ? 'bg-blue-100/60 dark:bg-blue-900/30' : 'bg-muted/60',
            )}
          >
            {s.numbered ? (
              <Hash
                className={cn(
                  'size-5',
                  canEdit
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground',
                )}
              />
            ) : (
              <FileText
                className={cn(
                  'size-5',
                  canEdit
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground',
                )}
              />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground text-base font-semibold">
              {s.numbered ? `${num ? ` ${num}.` : ''} ${s.title}` : s.title}
            </h3>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
              {s.createdOnUtc && (
                <span>
                  Created:{' '}
                  {new Date(s.createdOnUtc).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {s.lastModifiedOnUtc && (
                <span>
                  Last modified:{' '}
                  {new Date(s.lastModifiedOnUtc).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            {(s.description || s.sectionSumary) && (
              <div className="mt-2">
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Writing Guideline
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {formatDesc(s.description || s.sectionSumary || '')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            {canEdit && (
              <Button
                size="icon"
                onClick={() => void openSectionEditor(s.id, false)}
                title="Edit"
                className="size-9 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Edit3 className="size-4" />
              </Button>
            )}
            {!canEdit && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => void openSectionEditor(s.id, true)}
                title="View"
                className="size-9"
              >
                <Eye className="size-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                setMemberSheet({
                  id: s.markSectionId || s.id,
                  title: stripLatex(s.title),
                })
              }
              title="Members"
              className="size-9"
            >
              <Users className="size-4" />
            </Button>
          </div>
        </div>

        {/* Child sections */}
        {childSections(s.id).length > 0 && (
          <div className="space-y-3 border-t px-5 pt-3 pb-4">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <ChevronRight className="size-3" />
              Sub-sections
            </p>
            <div className="space-y-3">
              {childSections(s.id).map((child) =>
                renderSectionCard(child, true),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ContentLayout title="Workspace">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backPath)}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back to Paper
            </Button>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <LayoutList className="size-4" />
            <span>
              {editorSections.length} section
              {editorSections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Paper title banner */}
        <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50/40 px-6 py-4 dark:from-blue-950/30 dark:to-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
                <BookOpen className="size-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-foreground text-xl font-bold">
                  {paper.title}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Click Edit on any section to open the editor
                </p>
              </div>
              {(isAuthor || isManager) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMarkMainOpen(true)}
                  className="shrink-0 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                >
                  <Star className="size-4" />
                  Mark Main Section
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sections list */}
        {editorSections.length === 0 ? (
          <div className="border-border bg-card rounded-xl border py-16 text-center shadow-sm">
            <LayoutList className="text-muted-foreground/40 mx-auto mb-3 size-10" />
            <p className="text-muted-foreground font-medium">
              No sections assigned
            </p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              You do not have any sections assigned to this paper yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootSections.map((s) => renderSectionCard(s))}
            {/* Sections with unknown parent (not in root list) */}
            {editorSections
              .filter(
                (s) =>
                  s.parentSectionId &&
                  !editorSections.find((p) => p.id === s.parentSectionId),
              )
              .map((s) => renderSectionCard(s))}
          </div>
        )}
      </div>

      {/* Section Members Sheet */}
      {memberSheet && (
        <SectionMembersSheet
          sectionId={memberSheet.id}
          sectionTitle={memberSheet.title}
          paperId={paperId}
          open={!!memberSheet}
          onClose={() => setMemberSheet(null)}
          isAuthor={isAuthor || isManager}
        />
      )}

      {/* Mark Main Section Dialog */}
      <MarkMainSectionDialog
        paperId={paperId}
        subProjectId={subProjectId}
        isOpen={markMainOpen}
        onOpenChange={setMarkMainOpen}
      />
    </ContentLayout>
  );
};
