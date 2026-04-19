import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Plus,
  RefreshCw,
  Search,
  Users,
  UserPlus,
  X,
  Trash2,
  FileText,
  BookOpen,
  ClipboardList,
  Calendar,
  ExternalLink,
  Pencil,
  Layers,
  Eye,
  Loader2,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BTN } from '@/lib/button-styles';
import { cn } from '@/utils/cn';
import { useUser } from '@/lib/auth';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { useUpdateWritingPaper } from '@/features/paper-management/api/update-writing-paper';
import {
  PAPER_INITIALIZE_STATUS_OPTIONS,
  SUBMISSION_STATUS_LABELS,
  PAPER_MANAGEMENT_QUERY_KEYS,
} from '@/features/paper-management/constants';
import { useCombinePaper } from '@/features/paper-management/api/combine-paper';
import { useGetPaperVersions } from '@/features/paper-management/api/get-paper-versions';
import { useJournals } from '@/features/journal-management/api/get-journals';
import { JournalDto } from '@/features/journal-management/types';
import { usePaperMembers } from '@/features/project-management/api/papers/get-paper-members';
import { useRemovePaperMembers } from '@/features/project-management/api/papers/remove-paper-members';
import { useGetPaperSections } from '@/features/paper-management/api/get-paper-sections';
import { useSubProjects } from '@/features/project-management/api/papers/get-sub-projects';
import { ProjectMember } from '@/features/project-management/types';
import { PaperWorkspacePage } from '@/features/project-management/components/papers/paper-workspace-page';
import { PaperMembersDialog } from '@/features/project-management/components/papers/paper-members-sheet';
import {
  useCreateTask,
  usePaperTasks,
  useUpdateTask,
  useDeleteTask,
} from '@/features/task-management/api';
import {
  DATE_TASK_FILTER_OPTIONS,
  TASK_MANAGEMENT_QUERY_KEYS,
  PAPER_TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_LABELS,
} from '@/features/task-management/constants';
import {
  DateTaskFilterField,
  TaskItem,
} from '@/features/task-management/types';
import { PaperStatusHistory } from '@/features/paper-management/components/paper-status-history';

// Kanban column definitions
const KANBAN_COLUMNS = [
  {
    status: 1,
    label: 'To Do',
    dot: 'bg-slate-500',
    headerCls: 'bg-slate-100 border-slate-200',
    bodyCls: 'bg-slate-50 border-slate-200',
    countCls: 'bg-slate-200 text-slate-700',
    labelCls: 'text-slate-700 font-semibold',
  },
  {
    status: 2,
    label: 'In Progress',
    dot: 'bg-blue-500',
    headerCls: 'bg-blue-50 border-blue-200',
    bodyCls: 'bg-blue-50/50 border-blue-200',
    countCls: 'bg-blue-200 text-blue-700',
    labelCls: 'text-blue-700 font-semibold',
  },
  {
    status: 3,
    label: 'In Review',
    dot: 'bg-amber-500',
    headerCls: 'bg-amber-50 border-amber-200',
    bodyCls: 'bg-amber-50/50 border-amber-200',
    countCls: 'bg-amber-200 text-amber-800',
    labelCls: 'text-amber-800 font-semibold',
  },
  {
    status: 4,
    label: 'Completed',
    dot: 'bg-green-500',
    headerCls: 'bg-green-50 border-green-200',
    bodyCls: 'bg-green-50/50 border-green-200',
    countCls: 'bg-green-200 text-green-800',
    labelCls: 'text-green-800 font-semibold',
  },
  {
    status: 5,
    label: 'Closed',
    dot: 'bg-gray-500',
    headerCls: 'bg-gray-100 border-gray-200',
    bodyCls: 'bg-gray-50 border-gray-200',
    countCls: 'bg-gray-200 text-gray-700',
    labelCls: 'text-gray-700 font-semibold',
  },
];

// Helper to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export type Tab =
  | 'overview'
  | 'compile-paper'
  | 'sections'
  | 'contributor'
  | 'task'
  | 'submission';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'compile-paper', label: 'Preprint', icon: Layers },
  { id: 'sections', label: 'Sections', icon: BookOpen },
  { id: 'contributor', label: 'Contributor', icon: Users },
  { id: 'task', label: 'Task', icon: ClipboardList },
  { id: 'submission', label: 'Submission Status', icon: Calendar },
];

export const ProjectPaperDetailPage = ({
  projectId,
  paperId,
  isAuthor = false,
  isManager = false,
  backPath,
  combineEditorPath,
}: {
  projectId: string;
  paperId: string;
  isAuthor?: boolean;
  isManager?: boolean;
  backPath: string;
  combineEditorPath?: (combineId: string) => string;
}) => {
  const location = useLocation();
  const locationState = location.state as {
    initialTab?: Tab;
    initialSectionId?: string;
    subProjectId?: string;
  } | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    locationState?.initialTab ?? 'overview',
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const paperQuery = useWritingPaperDetail({ paperId });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(
    locationState?.initialSectionId ?? null,
  );
  useEffect(() => {
    if (!locationState?.initialSectionId) return;

    const nextState = { ...locationState };
    delete nextState.initialSectionId;

    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      },
    );
  }, [
    location.hash,
    location.pathname,
    location.search,
    locationState,
    navigate,
  ]);

  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<
    string | null
  >(null);
  const [isEditPaperOpen, setIsEditPaperOpen] = useState(false);
  const [editPaperForm, setEditPaperForm] = useState({
    context: '',
    abstract: '',
    researchGap: '',
    researchAim: '',
    gapType: '',
    mainContribution: '',
    status: 1,
    selectedJournalId: '',
    conferenceJournalStartAt: '',
    conferenceJournalEndAt: '',
  });
  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, number>
  >({});
  // Ref to track which task is currently being mutated via DnD
  const dndMutatingRef = useRef<Set<string>>(new Set());
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    memberId: '',
    taskType: '1',
    sectionId: '',
    status: '1',
    startDate: '',
    nextReviewDate: '',
    completeDate: '',
  });
  const [updateForm, setUpdateForm] = useState({
    name: '',
    description: '',
    assignedToUserName: '',
    status: '1',
    startDate: '',
    nextReviewDate: '',
  });
  const [localFilters, setLocalFilters] = useState({
    AssignedToUserName: '',
    Status: '',
    DateField: '',
    FromDate: '',
    ToDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    AssignedToUserName: '',
    Status: '',
    DateField: '',
    FromDate: '',
    ToDate: '',
  });

  const paper = paperQuery.data?.result?.paper;
  const paperType = paper?.paperType?.trim();

  const journalsQuery = useJournals({
    params: { PageNumber: 1, PageSize: 200 },
    queryConfig: { enabled: isEditPaperOpen } as any,
  });
  const journalResults: JournalDto[] = useMemo(
    () => (journalsQuery.data as any)?.result?.items ?? [],
    [journalsQuery.data],
  );
  const selectedJournal = useMemo(
    () =>
      journalResults.find((j) => j.id === editPaperForm.selectedJournalId) ??
      null,
    [journalResults, editPaperForm.selectedJournalId],
  );

  // When the journal list loads (after sheet opens), auto-select the paper's existing journal by name.
  useEffect(() => {
    if (!isEditPaperOpen || !journalResults.length || !paper?.journalName)
      return;
    const match = journalResults.find((j) => j.name === paper.journalName);
    setEditPaperForm((prev) => ({
      ...prev,
      selectedJournalId: prev.selectedJournalId || match?.id || '',
    }));
  }, [isEditPaperOpen, journalResults, paper?.journalName]);

  const updateWritingPaperMutation = useUpdateWritingPaper({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Paper updated successfully');
        setIsEditPaperOpen(false);
        queryClient.invalidateQueries({
          queryKey: ['writing-paper', paperId],
        });
      },
      onError: () => toast.error('Failed to update paper'),
    },
  });

  const handleEditPaperOpen = () => {
    if (!paper) return;
    setEditPaperForm({
      context: paper.context ?? '',
      abstract: paper.abstract ?? '',
      researchGap: paper.researchGap ?? '',
      researchAim: paper.researchAim ?? '',
      gapType: paper.gapType ?? '',
      mainContribution: paper.mainContribution ?? '',
      status: paper.status ?? 1,
      selectedJournalId: '',
      conferenceJournalStartAt: toDateTimeLocalValue(
        paper.conferenceJournalStartAt,
      ),
      conferenceJournalEndAt: toDateTimeLocalValue(
        paper.conferenceJournalEndAt,
      ),
    });
    setIsEditPaperOpen(true);
  };

  const handleEditPaperSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateWritingPaperMutation.mutate({
      paperId,
      data: {
        context: editPaperForm.context,
        abstract: editPaperForm.abstract,
        researchGap: editPaperForm.researchGap,
        researchAim: editPaperForm.researchAim,
        gapType: editPaperForm.gapType,
        mainContribution: editPaperForm.mainContribution,
        status: editPaperForm.status,
        conferenceJournalName: selectedJournal?.name ?? null,
        conferenceJournalId: selectedJournal?.id ?? null,
        conferenceJournalStartAt: editPaperForm.conferenceJournalStartAt
          ? new Date(editPaperForm.conferenceJournalStartAt).toISOString()
          : null,
        conferenceJournalEndAt: editPaperForm.conferenceJournalEndAt
          ? new Date(editPaperForm.conferenceJournalEndAt).toISOString()
          : null,
      },
    });
  };

  // When the paper detail API doesn't return subProjectId, fetch from the sub-projects list
  const subProjectsQuery = useSubProjects({
    projectId,
    params: { PageSize: 200 },
    queryConfig: { enabled: !!projectId && !paper?.subProjectId } as any,
  });
  const subProjectsList = (subProjectsQuery.data as any)?.result?.items ?? [];
  const matchedSubProject = subProjectsList.find(
    (sp: any) => sp.id === paperId,
  );

  const paperSubProjectId =
    paper?.subProjectId ||
    matchedSubProject?.subProjectId ||
    locationState?.subProjectId ||
    '';

  const combinePaperMutation = useCombinePaper({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Combined version created successfully');
        queryClient.invalidateQueries({
          queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.WRITING_PAPER, paperId],
        });
        queryClient.invalidateQueries({
          queryKey: [PAPER_MANAGEMENT_QUERY_KEYS.PAPER_VERSIONS, paperId],
        });
      },
      onError: () => toast.error('Failed to create combined version'),
    },
  });

  const paperVersionsQuery = useGetPaperVersions({
    paperId,
    queryConfig: { enabled: activeTab === 'compile-paper' && !!paperId } as any,
  });
  const paperVersions = paperVersionsQuery.data?.result?.items ?? [];

  const paperTasksQuery = usePaperTasks({
    paperId,
    params: {
      PageSize: 200,
      AssignedToUserName: appliedFilters.AssignedToUserName || undefined,
      Status: appliedFilters.Status || undefined,
      DateField: (appliedFilters.DateField || undefined) as
        | DateTaskFilterField
        | undefined,
      FromDate: appliedFilters.FromDate
        ? new Date(appliedFilters.FromDate).toISOString()
        : undefined,
      ToDate: appliedFilters.ToDate
        ? new Date(appliedFilters.ToDate).toISOString()
        : undefined,
    },
    queryConfig: { enabled: !!paperId },
  });

  const paperMembersQuery = usePaperMembers({
    subProjectId: paperSubProjectId,
    params: { pageNumber: 1, pageSize: 1000 },
    queryConfig: { enabled: !!paperSubProjectId } as any,
  });

  const removePaperMemberMutation = useRemovePaperMembers({
    subProjectId: paperSubProjectId,
    mutationConfig: {
      onSuccess: () => toast.success('Contributor removed'),
      onError: () => toast.error('Failed to remove contributor'),
    },
  });

  const sectionsQuery = useGetPaperSections({
    paperId,
    queryConfig: { enabled: !!paperId } as any,
  });

  const totalSections = sectionsQuery.data?.result?.items?.length || 0;
  const paperMembersList = (paperMembersQuery.data as any)?.result?.items ?? [];
  const totalPaperMembers = paperMembersList.filter((m: any) =>
    (m.role || '').toLowerCase().includes('member'),
  ).length;
  const editRoleMembers = paperMembersList.filter((m: any) => {
    const role = (m.role || '').toLowerCase();
    return role.includes('author');
  }).length;

  const currentUsername = (user?.preferredUsername || '').trim().toLowerCase();

  // Paper-level author: current user must have the 'author' role on this specific paper
  const isPaperAuthor =
    !paperMembersQuery.isLoading &&
    paperMembersList.some((m: any) => {
      const raw = (m.role ?? '').split(':').pop() ?? '';
      return (
        (m.username || '').trim().toLowerCase() === currentUsername &&
        raw === 'author'
      );
    });

  const memberOptions = useMemo(() => {
    const members: ProjectMember[] =
      (paperMembersQuery.data as any)?.result?.items ?? [];
    const seen = new Set<string>();
    const options = members
      .filter((m) => !(m.role || '').toLowerCase().includes('manager'))
      .filter((m) => {
        const username = (m.username || '').trim();
        if (!username || seen.has(username.toLowerCase())) return false;
        seen.add(username.toLowerCase());
        return true;
      })
      .map((m) => {
        const username = m.username.trim();
        const isMe = username.toLowerCase() === currentUsername;
        return {
          value: username,
          label: isMe ? 'me' : username,
          isMe,
        };
      })
      .sort((a, b) => {
        if (a.isMe && !b.isMe) return -1;
        if (!a.isMe && b.isMe) return 1;
        return a.value.localeCompare(b.value);
      });

    return options;
  }, [paperMembersQuery.data, currentUsername]);

  // Member options for create form — uses memberId as value (required by new API)
  const createMemberOptions = useMemo(() => {
    const members: ProjectMember[] =
      (paperMembersQuery.data as any)?.result?.items ?? [];
    const seen = new Set<string>();
    return members
      .filter((m) => !(m.role || '').toLowerCase().includes('manager'))
      .filter((m) => {
        if (!m.memberId || seen.has(m.memberId)) return false;
        seen.add(m.memberId);
        return true;
      })
      .map((m) => {
        const username = (m.username || '').trim();
        const isMe = username.toLowerCase() === currentUsername;
        return {
          value: m.memberId,
          label: isMe ? `me (${username})` : username,
          isMe,
        };
      })
      .sort((a, b) => {
        if (a.isMe && !b.isMe) return -1;
        if (!a.isMe && b.isMe) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [paperMembersQuery.data, currentUsername]);

  // Sections for the create form (only shown when taskType === Writing)
  const sectionOptions = useMemo(
    () => sectionsQuery.data?.result?.items ?? [],
    [sectionsQuery.data],
  );

  const createTaskMutation = useCreateTask({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Task created successfully');
        setIsCreateTaskOpen(false);
        setCreateForm({
          name: '',
          description: '',
          memberId: '',
          taskType: '1',
          sectionId: '',
          status: '1',
          startDate: '',
          nextReviewDate: '',
          completeDate: '',
        });
        queryClient.invalidateQueries({
          queryKey: [TASK_MANAGEMENT_QUERY_KEYS.PAPER_TASKS, paperId],
        });
      },
      onError: () => toast.error('Failed to create task'),
    },
  });

  const updateTaskMutation = useUpdateTask({
    mutationConfig: {
      onSuccess: (_data, variables) => {
        // Skip the toast for silent DnD status updates
        if (!dndMutatingRef.current.has(variables.id)) {
          toast.success('Task updated successfully');
          setEditingTask(null);
        }
        queryClient.invalidateQueries({
          queryKey: [TASK_MANAGEMENT_QUERY_KEYS.PAPER_TASKS, paperId],
        });
      },
      onError: (error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          toast.error(
            'You cannot update this task as it is not assigned to you.',
            { duration: 3000 },
          );
        } else {
          toast.error('Failed to update task');
        }
      },
    },
  });

  const deleteTaskMutation = useDeleteTask({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Task deleted successfully');
        queryClient.invalidateQueries({
          queryKey: [TASK_MANAGEMENT_QUERY_KEYS.PAPER_TASKS, paperId],
        });
      },
      onError: () => toast.error('Failed to delete task'),
    },
  });

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleTaskDrop = (task: TaskItem, newStatus: number) => {
    const currentStatus = localStatusOverrides[task.id] ?? task.status;
    if (currentStatus === newStatus) return;
    // Optimistic UI — move card immediately
    setLocalStatusOverrides((prev) => ({ ...prev, [task.id]: newStatus }));
    dndMutatingRef.current.add(task.id);
    updateTaskMutation.mutate(
      {
        id: task.id,
        data: {
          name: task.name,
          description: task.description || '',
          assignedToUserName: task.assignedToUserName ?? '',
          status: newStatus,
          startDate: task.startDate || new Date().toISOString(),
          nextReviewDate: task.nextReviewDate || null,
        },
      },
      {
        onSuccess: () => {
          dndMutatingRef.current.delete(task.id);
          // Refetch first, THEN clear the override so the card never
          // flashes back to the old column before fresh data arrives
          queryClient
            .refetchQueries({
              queryKey: [TASK_MANAGEMENT_QUERY_KEYS.PAPER_TASKS, paperId],
            })
            .then(() => {
              setLocalStatusOverrides((prev) => {
                const next = { ...prev };
                delete next[task.id];
                return next;
              });
            });
        },
        onError: (error: any) => {
          dndMutatingRef.current.delete(task.id);
          // Revert optimistic update
          setLocalStatusOverrides((prev) => {
            const next = { ...prev };
            delete next[task.id];
            return next;
          });
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            toast.error(
              'You cannot update this task as it is not assigned to you.',
            );
          } else {
            toast.error('Failed to update task status');
          }
        },
      },
    );
  };

  if (paperQuery.isLoading) {
    return (
      <ContentLayout title="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </ContentLayout>
    );
  }

  const openUpdateTask = (task: TaskItem) => {
    setEditingTask(task);
    setUpdateForm({
      name: task.name,
      description: task.description || '',
      assignedToUserName: task.assignedToUserName || '',
      status: String(task.status),
      startDate: toDateTimeLocalValue(task.startDate),
      nextReviewDate: toDateTimeLocalValue(task.nextReviewDate),
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters((prev) => {
      if (key === 'DateField' && !value) {
        return { ...prev, DateField: '', FromDate: '', ToDate: '' };
      }
      return { ...prev, [key]: value };
    });
  };

  const applyTaskFilters = (e?: FormEvent) => {
    e?.preventDefault();
    setAppliedFilters(localFilters);
  };

  const clearTaskFilters = () => {
    const reset = {
      AssignedToUserName: '',
      Status: '',
      DateField: '',
      FromDate: '',
      ToDate: '',
    };
    setLocalFilters(reset);
    setAppliedFilters(reset);
  };

  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.memberId) {
      toast.error('Task name and assignee are required');
      return;
    }

    createTaskMutation.mutate({
      paperId,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      memberId: createForm.memberId,
      type: Number(createForm.taskType),
      sectionId:
        createForm.taskType === '2' ? createForm.sectionId || null : null,
      status: Number(createForm.status),
      startDate: createForm.startDate
        ? new Date(createForm.startDate).toISOString()
        : new Date().toISOString(),
      nextReviewDate: createForm.nextReviewDate
        ? new Date(createForm.nextReviewDate).toISOString()
        : null,
      completeDate: createForm.completeDate
        ? new Date(createForm.completeDate).toISOString()
        : null,
    });
  };

  const handleUpdateTask = (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTaskMutation.mutate({
      id: editingTask.id,
      data: {
        name: isPaperAuthor ? updateForm.name : editingTask.name,
        description: isPaperAuthor
          ? updateForm.description
          : editingTask.description || '',
        assignedToUserName: isPaperAuthor
          ? updateForm.assignedToUserName
          : (editingTask.assignedToUserName ?? ''),
        status: Number(updateForm.status),
        startDate: updateForm.startDate
          ? new Date(updateForm.startDate).toISOString()
          : editingTask.startDate || new Date().toISOString(),
        nextReviewDate: updateForm.nextReviewDate
          ? new Date(updateForm.nextReviewDate).toISOString()
          : null,
      },
    });
  };
  const isDateFieldSelected = Boolean(localFilters.DateField);
  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  if (!paper) {
    return (
      <ContentLayout title="Paper Not Found">
        <div className="py-12 text-center">
          <p className="text-secondary">Paper not found</p>
          <Button onClick={() => navigate(backPath)} className="mt-4">
            Go Back
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="" description="">
      <div className="space-y-6">
        {/* ── Page header (outside card) ───────────────────────────── */}
        <div>
          <h1 className="text-primary font-serif text-4xl font-extrabold tracking-tight">
            {paper.title}
          </h1>
        </div>

        {/* ── Single unified card ──────────────────────────────────── */}
        <div className="overflow-hidden rounded-md border bg-[#fffaf1] py-0 shadow-sm">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
            {/* Left: status + template + created-by */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="active">
                {SUBMISSION_STATUS_LABELS[paper.submissionStatus ?? 1] ??
                  'Draft'}
              </Badge>
              {paperType && <Badge variant="outline">{paperType}</Badge>}
              {paper.template && (
                <Badge variant="outline">{paper.template}</Badge>
              )}
              {paper.createdBy && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground border-border bg-muted/40 ml-1 cursor-default rounded border px-2 py-0.5 text-xs font-medium">
                        {paper.createdBy}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Created by {paper.createdBy}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2">
              {paper.filePath && (
                <Button variant="action" size="action" asChild>
                  <a
                    href={paper.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3" />
                    View PDF
                  </a>
                </Button>
              )}
              {isPaperAuthor && (
                <Button
                  size="default"
                  variant="outline"
                  onClick={handleEditPaperOpen}
                >
                  Edit Paper
                </Button>
              )}
            </div>
          </div>

          <div className="bg-border/60 h-px" />

          {/* Tab bar */}
          <div className="border-border border-b px-6">
            <nav className="-mb-px flex gap-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'text-muted-foreground hover:border-border hover:text-foreground border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <>
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  <div className="bg-card rounded-xl border p-5 shadow-sm transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-primary rounded-md p-1.5">
                          <Layers className="size-4" />
                        </div>
                        <p className="text-muted-foreground font-sans text-xs font-bold">
                          Sections
                        </p>
                      </div>
                      <p className="text-foreground font-serif text-3xl font-bold">
                        {sectionsQuery.isLoading ? (
                          <Loader2 className="text-tertiary size-6 animate-spin" />
                        ) : (
                          totalSections
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border p-5 shadow-sm transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-primary rounded-md p-1.5">
                          <Users className="size-4" />
                        </div>
                        <p className="text-muted-foreground font-sans text-xs font-bold">
                          Contributors
                        </p>
                      </div>
                      <p className="text-foreground font-serif text-3xl font-bold">
                        {paperMembersQuery.isLoading ? (
                          <Loader2 className="text-tertiary size-6 animate-spin" />
                        ) : (
                          totalPaperMembers
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border p-5 shadow-sm transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-primary rounded-md p-1.5">
                          <Pencil className="size-4" />
                        </div>
                        <p className="text-muted-foreground font-sans text-xs font-bold">
                          Authors
                        </p>
                      </div>
                      <p className="text-foreground font-serif text-3xl font-bold">
                        {paperMembersQuery.isLoading ? (
                          <Loader2 className="text-tertiary size-6 animate-spin" />
                        ) : (
                          editRoleMembers
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Abstract */}
                  <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-sm">
                    <h3 className="text-foreground mb-3 font-sans text-sm font-semibold">
                      Abstract
                    </h3>
                    <p className="text-primary text-[14px] leading-relaxed whitespace-pre-wrap">
                      {paper.abstract || 'No abstract provided.'}
                    </p>
                  </div>

                  {/* Research Aim */}
                  <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-sm">
                    <h3 className="text-foreground mb-3 font-sans text-sm font-semibold">
                      Research Aim
                    </h3>
                    <p className="text-primary text-[14px] leading-relaxed whitespace-pre-wrap">
                      {paper.researchAim || 'No research aim defined.'}
                    </p>
                  </div>

                  {/* Context */}
                  <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-sm">
                    <h3 className="text-foreground mb-3 font-sans text-sm font-semibold">
                      Context
                    </h3>
                    <p className="text-primary text-[14px] leading-relaxed whitespace-pre-wrap">
                      {paper.context || 'No context defined.'}
                    </p>
                  </div>

                  {/* Research Gap */}
                  <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-sm">
                    <h3 className="text-foreground mb-3 font-sans text-sm font-semibold">
                      Research Gap
                    </h3>
                    <p className="text-primary text-[14px] leading-relaxed whitespace-pre-wrap">
                      {paper.researchGap ||
                        'No research gap explicitly stated.'}
                    </p>
                    {paper.gapType && (
                      <span className="bg-surface text-secondary mt-3 inline-block rounded-md px-2.5 py-0.5 font-sans text-[10px]">
                        Type: {paper.gapType}
                      </span>
                    )}
                  </div>

                  {/* Main Contribution */}
                  <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-sm">
                    <h3 className="text-foreground mb-3 font-sans text-sm font-semibold">
                      Main Contribution
                    </h3>
                    <p className="text-primary text-[14px] leading-relaxed whitespace-pre-wrap">
                      {paper.mainContribution || 'No main contribution listed.'}
                    </p>
                  </div>

                  {/* Journal / Conference */}
                  {((paper as any).journalName ||
                    (paper as any).journal ||
                    (paper as any).conferenceName) && (
                    <div className="bg-card rounded-xl border p-5 transition-shadow hover:shadow-sm">
                      <h3 className="text-foreground mb-3 font-sans text-sm font-semibold">
                        Journal / Conference
                      </h3>
                      <div className="space-y-2">
                        {((paper as any).journalName ||
                          (paper as any).journal) && (
                          <p className="text-primary text-[14px] leading-relaxed">
                            <span className="mr-2 font-semibold">Journal:</span>
                            {(paper as any).journalName ||
                              (paper as any).journal}
                          </p>
                        )}
                        {(paper as any).conferenceName && (
                          <p className="text-primary text-[14px] leading-relaxed">
                            <span className="mr-2 font-semibold">
                              Conference:
                            </span>
                            {(paper as any).conferenceName}
                          </p>
                        )}
                        {(paper as any).conferenceJournalStartAt && (
                          <p className="text-primary text-[14px] leading-relaxed">
                            <span className="mr-2 font-semibold">Start:</span>
                            {new Date(
                              (paper as any).conferenceJournalStartAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {(paper as any).conferenceJournalEndAt && (
                          <p className="text-primary text-[14px] leading-relaxed">
                            <span className="mr-2 font-semibold">End:</span>
                            {new Date(
                              (paper as any).conferenceJournalEndAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Combines Panel ────────────────────────────────────── */}
            {activeTab === 'compile-paper' && (
              <div>
                <div className="border-border -mx-6 -mt-6 mb-6 flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-foreground text-base font-semibold">
                      Combined Versions
                    </h2>
                    <p className="text-secondary mt-1 font-sans text-[10px]">
                      {paperVersions.length} version
                      {paperVersions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isPaperAuthor && (
                    <Button
                      variant="darkRed"
                      className={cn('ml-auto gap-1.5')}
                      size="action"
                      disabled={combinePaperMutation.isPending}
                      onClick={() => {
                        combinePaperMutation.mutate({
                          paperId,
                          data: {
                            projectId: paperSubProjectId,
                          },
                        });
                      }}
                    >
                      {combinePaperMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4" />
                      )}
                      Create New Version
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="action"
                    onClick={() => paperVersionsQuery.refetch()}
                    disabled={paperVersionsQuery.isFetching}
                    title="Refresh"
                    className="border-transparent"
                  >
                    <RefreshCw
                      className={cn(
                        'size-4',
                        paperVersionsQuery.isFetching && 'animate-spin',
                      )}
                    />
                  </Button>
                </div>
                <div>
                  {paperVersionsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : paperVersions.length === 0 ? (
                    <div className="bg-surface-container-low flex flex-col items-center justify-center rounded-xl border border-transparent py-10 text-center">
                      <Layers className="text-secondary mb-3 size-10 opacity-50" />
                      <p className="text-primary text-sm font-medium">
                        No combined versions yet.
                      </p>
                      {isPaperAuthor && (
                        <p className="text-secondary mt-1 text-xs">
                          Click &ldquo;Create Combined Version&rdquo; to
                          generate a combined version.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paperVersions.map((version) => (
                        <div
                          key={version.id}
                          className="bg-surface flex items-center justify-between rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-primary truncate text-sm font-semibold">
                              {version.name}
                            </p>
                            <div className="text-secondary mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-sans text-[10px]">
                              {version.createdBy && (
                                <span>
                                  <span className="text-secondary font-medium">
                                    By{' '}
                                  </span>
                                  {version.createdBy}
                                </span>
                              )}
                              {version.createdOnUtc && (
                                <span>
                                  <span className="text-secondary font-medium">
                                    Created{' '}
                                  </span>
                                  {new Date(
                                    version.createdOnUtc,
                                  ).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                              {version.lastModifiedOnUtc && (
                                <span>
                                  <span className="text-secondary font-medium">
                                    Last modified{' '}
                                  </span>
                                  {new Date(
                                    version.lastModifiedOnUtc,
                                  ).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPaperAuthor && (
                              <Button
                                variant="outline"
                                size="action"
                                className="bg-surface-container-low text-primary hover:bg-surface-container gap-1.5 border-transparent"
                                onClick={() => {
                                  if (combineEditorPath) {
                                    navigate(
                                      combineEditorPath(version.id) +
                                        '?edit=true',
                                    );
                                  }
                                }}
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="action"
                              className="bg-surface-container-low text-primary hover:bg-surface-container gap-1.5 border-transparent"
                              onClick={() => {
                                if (combineEditorPath) {
                                  navigate(combineEditorPath(version.id));
                                }
                              }}
                            >
                              <Eye className="size-4" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Sections Panel ──────────────────────────────────── */}
            {activeTab === 'sections' && (
              <div className="-mx-6 -mb-6">
                <div className="border-border -mt-6 mb-0 flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-foreground text-base font-semibold">
                      Sections
                    </h2>
                    <p className="text-muted-foreground mt-1 font-sans text-[10px]">
                      {totalSections} section
                      {totalSections !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="action"
                    onClick={() => {
                      sectionsQuery.refetch();
                      queryClient.invalidateQueries({
                        queryKey: [
                          PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS,
                          paperId,
                        ],
                      });
                    }}
                    disabled={sectionsQuery.isFetching}
                    title="Refresh"
                    className="border-transparent"
                  >
                    <RefreshCw
                      className={cn(
                        'size-4',
                        sectionsQuery.isFetching && 'animate-spin',
                      )}
                    />
                  </Button>
                </div>
                <PaperWorkspacePage
                  projectId={projectId}
                  paperId={paperId}
                  isAuthor={isPaperAuthor}
                  isManager={isManager}
                  backPath={backPath}
                  embedded={true}
                  initialSectionId={pendingSectionId ?? undefined}
                  onInitialSectionOpened={() => setPendingSectionId(null)}
                />
              </div>
            )}

            {/* ── Contributors Panel ──────────────────────────────── */}
            {activeTab === 'contributor' && (
              <div>
                <div className="border-border -mx-6 -mt-6 mb-6 flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-foreground text-base font-semibold">
                      Contributors
                    </h2>
                    <p className="text-muted-foreground mt-1 font-sans text-[10px]">
                      {totalPaperMembers} contributor
                      {totalPaperMembers !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(isPaperAuthor || isManager) && (
                      <Button
                        size="action"
                        variant="darkRed"
                        onClick={() => setIsMembersOpen(true)}
                        className="gap-1.5"
                      >
                        <UserPlus className="size-4" />
                        Add Contributor
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="action"
                      onClick={() => paperMembersQuery.refetch()}
                      disabled={paperMembersQuery.isFetching}
                      title="Refresh"
                      className="border-transparent"
                    >
                      <RefreshCw
                        className={cn(
                          'size-4',
                          paperMembersQuery.isFetching && 'animate-spin',
                        )}
                      />
                    </Button>
                  </div>
                </div>

                {paperMembersQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : paperMembersList.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    No contributors found.
                  </div>
                ) : (
                  <div className="bg-card overflow-hidden rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          {(isPaperAuthor || isManager) && (
                            <TableHead className="w-16 text-center">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...paperMembersList]
                          .sort((a: any, b: any) => {
                            const roleOrder = (role: string) => {
                              const raw = (role ?? '').split(':').pop() ?? '';
                              if (raw === 'author') return 0;
                              if (raw === 'member' || raw === 'edit') return 1;
                              return 2;
                            };
                            return roleOrder(a.role) - roleOrder(b.role);
                          })
                          .map((member: any) => {
                            const parts = (member.role ?? '').split(':');
                            const raw =
                              parts.length > 1
                                ? parts[parts.length - 1]
                                : parts[0];
                            let label: string;
                            if (raw === 'author') label = 'Author';
                            else if (raw === 'member') label = 'Contributor';
                            else if (raw === 'edit') label = 'Editor';
                            else if (raw === 'read' || raw === 'view')
                              label = 'Viewer';
                            else
                              label = raw
                                ? raw.charAt(0).toUpperCase() + raw.slice(1)
                                : (member.role ?? '');
                            const cls =
                              raw === 'author'
                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400'
                                : raw === 'member' || raw === 'edit'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                                  : '';
                            const canDelete = isPaperAuthor
                              ? raw === 'member'
                              : isManager
                                ? raw === 'author'
                                : false;
                            return (
                              <TableRow
                                key={member.id ?? member.memberId}
                                className="hover:bg-muted/30"
                              >
                                <TableCell className="text-foreground font-medium">
                                  {member.firstName || member.lastName
                                    ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
                                    : member.username}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {member.email}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={cls}>
                                    {label}
                                  </Badge>
                                </TableCell>
                                {(isPaperAuthor || isManager) && (
                                  <TableCell className="text-center">
                                    {canDelete && (
                                      <Button
                                        size="action"
                                        variant="destructive"
                                        title="Remove contributor"
                                        disabled={
                                          removePaperMemberMutation.isPending &&
                                          confirmDeleteMemberId ===
                                            member.memberId
                                        }
                                        onClick={() =>
                                          setConfirmDeleteMemberId(
                                            member.memberId,
                                          )
                                        }
                                      >
                                        {removePaperMemberMutation.isPending &&
                                        confirmDeleteMemberId ===
                                          member.memberId ? (
                                          <>
                                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                                            REMOVE
                                          </>
                                        ) : (
                                          'REMOVE'
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
            )}

            {/* ── Tasks Panel ─────────────────────────────────────── */}
            {activeTab === 'task' && (
              <div>
                <div className="border-border -mx-6 -mt-6 mb-6 flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-foreground text-base font-semibold">
                      Tasks
                    </h2>
                    <p className="text-muted-foreground mt-1 font-sans text-[10px]">
                      {paperTasksQuery.data?.result?.paging?.totalCount != null
                        ? `${paperTasksQuery.data.result.paging.totalCount} task${paperTasksQuery.data.result.paging.totalCount !== 1 ? 's' : ''}`
                        : 'Paper tasks'}
                    </p>
                  </div>
                  {isPaperAuthor && (
                    <Button
                      variant="darkRed"
                      className={cn('ml-auto')}
                      size="action"
                      onClick={() => {
                        setIsCreateTaskOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Create Task
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="action"
                    onClick={() => paperTasksQuery.refetch()}
                    disabled={paperTasksQuery.isFetching}
                    title="Refresh tasks"
                    className="border-transparent"
                  >
                    <RefreshCw
                      className={cn(
                        'size-4',
                        paperTasksQuery.isFetching && 'animate-spin',
                      )}
                    />
                  </Button>
                </div>

                <form
                  onSubmit={applyTaskFilters}
                  className="bg-muted/30 mb-4 rounded-xl p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="filterAssignee"
                        className="text-secondary font-sans text-[10px]"
                      >
                        Assignee
                      </label>
                      <select
                        id="filterAssignee"
                        className="bg-surface border-surface-container-highest text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        value={localFilters.AssignedToUserName}
                        onChange={(e) =>
                          handleFilterChange(
                            'AssignedToUserName',
                            e.target.value,
                          )
                        }
                      >
                        <option value="">All Assignees</option>
                        {memberOptions.map((member) => (
                          <option key={member.value} value={member.value}>
                            {member.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="filterStatus"
                        className="text-secondary font-sans text-[10px]"
                      >
                        Status
                      </label>
                      <select
                        id="filterStatus"
                        className="border-surface-container-highest bg-surface text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        value={localFilters.Status}
                        onChange={(e) =>
                          handleFilterChange('Status', e.target.value)
                        }
                      >
                        <option value="">All Status</option>
                        {PAPER_TASK_STATUS_OPTIONS.map((status) => (
                          <option
                            key={status.value}
                            value={String(status.value)}
                          >
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="filterDateField"
                        className="text-secondary font-sans text-[10px]"
                      >
                        Date Field
                      </label>
                      <select
                        id="filterDateField"
                        className="border-surface-container-highest bg-surface text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        value={localFilters.DateField}
                        onChange={(e) =>
                          handleFilterChange('DateField', e.target.value)
                        }
                      >
                        <option value="">Select Date Field</option>
                        {DATE_TASK_FILTER_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="filterFromDate"
                        className="text-secondary font-sans text-[10px]"
                      >
                        From Date
                      </label>
                      <Input
                        id="filterFromDate"
                        type="date"
                        value={localFilters.FromDate}
                        disabled={!isDateFieldSelected}
                        onChange={(e) =>
                          handleFilterChange('FromDate', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="filterToDate"
                        className="text-secondary font-sans text-[10px]"
                      >
                        To Date
                      </label>
                      <Input
                        id="filterToDate"
                        type="date"
                        value={localFilters.ToDate}
                        disabled={!isDateFieldSelected}
                        onChange={(e) =>
                          handleFilterChange('ToDate', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    {activeFilterCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="action"
                        onClick={clearTaskFilters}
                        className="text-secondary hover:text-primary mr-auto"
                      >
                        <X className="size-4" />
                        Clear ({activeFilterCount})
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="action"
                      onClick={clearTaskFilters}
                      className={BTN.CANCEL}
                    >
                      Reset
                    </Button>
                    <Button type="submit" size="action" className={BTN.EDIT}>
                      <Search className="size-4" />
                      Search
                    </Button>
                  </div>
                </form>

                {/* ── Kanban Board ───────────────────────────────────────── */}
                {paperTasksQuery.isLoading ? (
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {KANBAN_COLUMNS.filter((c) => c.status !== 5).map(
                        (col) => {
                          const allItems =
                            paperTasksQuery.data?.result?.items ?? [];
                          const colTasks = allItems
                            .map((t) => ({
                              ...t,
                              status: localStatusOverrides[t.id] ?? t.status,
                            }))
                            .filter((t) => t.status === col.status);
                          const isDragTarget = dragOverCol === col.status;
                          return (
                            <div
                              key={col.status}
                              className="flex min-w-0 flex-col"
                            >
                              {/* Column header */}
                              <div
                                className={cn(
                                  'flex items-center gap-2 rounded-t-lg border-t border-r border-l px-3 py-2.5',
                                  col.headerCls,
                                )}
                              >
                                <span
                                  className={cn(
                                    'size-2 shrink-0 rounded-full',
                                    col.dot,
                                  )}
                                />
                                <span
                                  className={cn(
                                    'flex-1 text-sm font-semibold',
                                    col.labelCls,
                                  )}
                                >
                                  {col.label}
                                </span>
                                <span
                                  className={cn(
                                    'rounded-full px-1.5 py-0.5 text-xs font-bold',
                                    col.countCls,
                                  )}
                                >
                                  {colTasks.length}
                                </span>
                              </div>

                              {/* Column body – drop zone */}
                              <div
                                className={cn(
                                  'min-h-36 flex-1 space-y-2 rounded-b-lg border p-2 transition-colors duration-150',
                                  col.bodyCls,
                                  isDragTarget &&
                                    'ring-primary/40 ring-2 ring-inset',
                                )}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                  if (dragOverCol !== col.status)
                                    setDragOverCol(col.status);
                                }}
                                onDragLeave={(e) => {
                                  // Only clear if leaving the column entirely
                                  if (
                                    !e.currentTarget.contains(
                                      e.relatedTarget as Node,
                                    )
                                  )
                                    setDragOverCol(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverCol(null);
                                  if (!draggedTaskId) return;
                                  const task = allItems.find(
                                    (t) => t.id === draggedTaskId,
                                  );
                                  if (!task) return;
                                  handleTaskDrop(task, col.status);
                                }}
                              >
                                {colTasks.length === 0 ? (
                                  <div
                                    className={cn(
                                      'flex h-24 items-center justify-center rounded-md border-2 border-dashed transition-colors duration-150',
                                      isDragTarget
                                        ? 'border-primary/40 bg-primary/5'
                                        : 'border-transparent',
                                    )}
                                  >
                                    <p className="text-muted-foreground text-xs">
                                      {isDragTarget ? 'Drop here' : 'No tasks'}
                                    </p>
                                  </div>
                                ) : (
                                  colTasks.map((task) => {
                                    const isPending =
                                      dndMutatingRef.current.has(task.id);
                                    return (
                                      <div
                                        key={task.id}
                                        draggable
                                        role="button"
                                        tabIndex={0}
                                        onDragStart={(e) => {
                                          setDraggedTaskId(task.id);
                                          e.dataTransfer.effectAllowed = 'move';
                                          e.dataTransfer.setData(
                                            'text/plain',
                                            task.id,
                                          );
                                        }}
                                        onDragEnd={() => {
                                          setDraggedTaskId(null);
                                          setDragOverCol(null);
                                        }}
                                        onClick={() =>
                                          isPaperAuthor
                                            ? openUpdateTask(task)
                                            : setViewingTask(task)
                                        }
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                          ) {
                                            e.preventDefault();
                                            if (isPaperAuthor)
                                              openUpdateTask(task);
                                            else setViewingTask(task);
                                          }
                                        }}
                                        className={cn(
                                          'group bg-card relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
                                          isPending && 'ring-primary/40 ring-1',
                                        )}
                                      >
                                        {/* Pending indicator */}
                                        {isPending && (
                                          <span className="bg-primary absolute top-2 right-2 inline-flex size-2 animate-pulse rounded-full" />
                                        )}

                                        {/* Name + section editor button */}
                                        <div className="flex items-start gap-1.5">
                                          <p className="flex-1 text-sm leading-snug font-medium">
                                            {task.name}
                                          </p>
                                          {task.sectionId && (
                                            <Button
                                              size="icon-sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingSectionId(
                                                  task.sectionId!,
                                                );
                                                setActiveTab('sections');
                                              }}
                                              title="Open in section editor"
                                              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                              <BookOpen className="size-3.5 text-blue-600" />
                                            </Button>
                                          )}
                                        </div>

                                        {/* Task type badge */}
                                        {task.taskType && (
                                          <span
                                            className={cn(
                                              'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase',
                                              (
                                                {
                                                  1: 'bg-violet-100 text-violet-700',
                                                  2: 'bg-emerald-100 text-emerald-700',
                                                  3: 'bg-amber-100 text-amber-700',
                                                  4: 'bg-muted text-muted-foreground',
                                                } as Record<number, string>
                                              )[task.taskType] ??
                                                'bg-muted text-muted-foreground',
                                            )}
                                          >
                                            {TASK_TYPE_LABELS[task.taskType] ??
                                              'Task'}
                                          </span>
                                        )}

                                        {/* Description */}
                                        {task.description && (
                                          <p className="text-muted-foreground line-clamp-2 text-xs">
                                            {task.description}
                                          </p>
                                        )}

                                        {/* Section title */}
                                        {task.sectionTitle && (
                                          <p className="text-muted-foreground truncate text-[11px]">
                                            {task.sectionTitle}
                                          </p>
                                        )}

                                        {/* Assignee */}
                                        <div className="flex items-center gap-1.5">
                                          <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
                                            {task.assignedToUserName?.charAt(
                                              0,
                                            ) ?? '?'}
                                          </div>
                                          <span className="text-muted-foreground truncate text-xs">
                                            {task.assignedToUserName ?? '—'}
                                          </span>
                                        </div>

                                        {/* Dates */}
                                        {(task.startDate ||
                                          task.nextReviewDate ||
                                          task.completeDate) && (
                                          <div className="space-y-0.5 border-t pt-1.5">
                                            {task.startDate && (
                                              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                                <Calendar className="size-3 shrink-0" />
                                                <span>
                                                  Start:{' '}
                                                  {formatDate(task.startDate)}
                                                </span>
                                              </div>
                                            )}
                                            {task.nextReviewDate && (
                                              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                                <Calendar className="size-3 shrink-0" />
                                                <span>
                                                  Review:{' '}
                                                  {formatDate(
                                                    task.nextReviewDate,
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                            {task.completeDate && (
                                              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                                <Calendar className="size-3 shrink-0" />
                                                <span>
                                                  Due:{' '}
                                                  {formatDate(
                                                    task.completeDate,
                                                  )}
                                                </span>
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
                          );
                        },
                      )}
                    </div>

                    {/* ── Closed row ─────────────────────────────────────── */}
                    {(() => {
                      const closedCol = KANBAN_COLUMNS.find(
                        (c) => c.status === 5,
                      )!;
                      const allItems =
                        paperTasksQuery.data?.result?.items ?? [];
                      const closedTasks = allItems
                        .map((t) => ({
                          ...t,
                          status: localStatusOverrides[t.id] ?? t.status,
                        }))
                        .filter((t) => t.status === 5);
                      const isDragTarget = dragOverCol === 5;
                      return (
                        <div className="flex min-w-0 flex-col">
                          <div
                            className={cn(
                              'flex items-center gap-2 rounded-t-lg border-t border-r border-l px-3 py-2.5',
                              closedCol.headerCls,
                            )}
                          >
                            <span
                              className={cn(
                                'size-2 shrink-0 rounded-full',
                                closedCol.dot,
                              )}
                            />
                            <span
                              className={cn(
                                'flex-1 text-sm font-semibold',
                                closedCol.labelCls,
                              )}
                            >
                              {closedCol.label}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs font-bold',
                                closedCol.countCls,
                              )}
                            >
                              {closedTasks.length}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'rounded-b-lg border p-2 transition-colors duration-150',
                              closedCol.bodyCls,
                              isDragTarget &&
                                'ring-primary/40 ring-2 ring-inset',
                            )}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverCol !== 5) setDragOverCol(5);
                            }}
                            onDragLeave={(e) => {
                              if (
                                !e.currentTarget.contains(
                                  e.relatedTarget as Node,
                                )
                              )
                                setDragOverCol(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverCol(null);
                              if (!draggedTaskId) return;
                              const task = allItems.find(
                                (t) => t.id === draggedTaskId,
                              );
                              if (!task) return;
                              handleTaskDrop(task, 5);
                            }}
                          >
                            {closedTasks.length === 0 ? (
                              <div
                                className={cn(
                                  'flex h-10 items-center justify-center rounded-md border-2 border-dashed transition-colors duration-150',
                                  isDragTarget
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-transparent',
                                )}
                              >
                                <p className="text-muted-foreground text-xs">
                                  {isDragTarget ? 'Drop here' : 'No tasks'}
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {closedTasks.map((task) => {
                                  const isPending = dndMutatingRef.current.has(
                                    task.id,
                                  );
                                  return (
                                    <div
                                      key={task.id}
                                      draggable
                                      role="button"
                                      tabIndex={0}
                                      onDragStart={(e) => {
                                        setDraggedTaskId(task.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData(
                                          'text/plain',
                                          task.id,
                                        );
                                      }}
                                      onDragEnd={() => {
                                        setDraggedTaskId(null);
                                        setDragOverCol(null);
                                      }}
                                      onClick={() =>
                                        isPaperAuthor
                                          ? openUpdateTask(task)
                                          : setViewingTask(task)
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === 'Enter' ||
                                          e.key === ' '
                                        ) {
                                          e.preventDefault();
                                          if (isPaperAuthor)
                                            openUpdateTask(task);
                                          else setViewingTask(task);
                                        }
                                      }}
                                      className={cn(
                                        'bg-card group relative flex w-56 shrink-0 cursor-pointer flex-col gap-1.5 rounded-lg border p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
                                        isPending && 'ring-primary/40 ring-1',
                                      )}
                                    >
                                      {isPending && (
                                        <span className="bg-primary absolute top-2 right-2 inline-flex size-2 animate-pulse rounded-full" />
                                      )}
                                      <p className="text-sm leading-snug font-medium">
                                        {task.name}
                                      </p>
                                      {task.taskType && (
                                        <span
                                          className={cn(
                                            'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase',
                                            (
                                              {
                                                1: 'bg-violet-100 text-violet-700',
                                                2: 'bg-emerald-100 text-emerald-700',
                                                3: 'bg-amber-100 text-amber-700',
                                                4: 'bg-muted text-muted-foreground',
                                              } as Record<number, string>
                                            )[task.taskType] ??
                                              'bg-muted text-muted-foreground',
                                          )}
                                        >
                                          {TASK_TYPE_LABELS[task.taskType] ??
                                            'Task'}
                                        </span>
                                      )}
                                      {task.assignedToUserName && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
                                            {task.assignedToUserName.charAt(0)}
                                          </div>
                                          <span className="text-muted-foreground truncate text-xs">
                                            {task.assignedToUserName}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ── Submission Status Panel ──────────────────────────── */}
            {activeTab === 'submission' && (
              <PaperStatusHistory paperId={paperId} projectId={projectId} />
            )}
          </div>
        </div>
      </div>

      {/* ── View Task Info Dialog (non-authors, read-only) ───────────── */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingTask?.name}</DialogTitle>
            <DialogDescription>
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase',
                  (
                    {
                      1: 'bg-violet-100 text-violet-700',
                      2: 'bg-emerald-100 text-emerald-700',
                      3: 'bg-amber-100 text-amber-700',
                      4: 'bg-muted text-muted-foreground',
                    } as Record<number, string>
                  )[viewingTask?.taskType ?? 0] ??
                    'bg-muted text-muted-foreground',
                )}
              >
                {TASK_TYPE_LABELS[viewingTask?.taskType ?? 0] ?? 'Task'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {viewingTask?.description && (
              <div className="space-y-1.5">
                <p className="text-secondary font-sans text-[10px] font-bold tracking-widest uppercase">
                  Description
                </p>
                <p className="bg-surface-container text-primary rounded-md px-3 py-2 text-sm leading-relaxed">
                  {viewingTask.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-secondary font-sans text-[10px] font-bold tracking-widest uppercase">
                  Assigned To
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
                    {viewingTask?.assignedToUserName?.charAt(0) ?? '?'}
                  </div>
                  <span className="text-primary text-sm">
                    {viewingTask?.assignedToUserName ?? '—'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-secondary font-sans text-[10px] font-bold tracking-widest uppercase">
                  Status
                </p>
                <span className="text-primary text-sm">
                  {PAPER_TASK_STATUS_OPTIONS.find(
                    (s) => s.value === viewingTask?.status,
                  )?.label ?? '—'}
                </span>
              </div>
            </div>

            {viewingTask?.sectionTitle && (
              <div className="space-y-1.5">
                <p className="text-secondary font-sans text-[10px] font-bold tracking-widest uppercase">
                  Section
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-primary text-sm">
                    {viewingTask.sectionTitle}
                  </span>
                  {viewingTask.sectionId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="action"
                      className="shrink-0 gap-1.5"
                      onClick={() => {
                        setViewingTask(null);
                        setPendingSectionId(viewingTask.sectionId!);
                        setActiveTab('sections');
                      }}
                    >
                      <BookOpen className="size-3.5" />
                      Open Editor
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(viewingTask?.startDate ||
              viewingTask?.nextReviewDate ||
              viewingTask?.completeDate) && (
              <div className="space-y-2 border-t pt-3">
                {viewingTask.startDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="text-primary">
                      {formatDate(viewingTask.startDate)}
                    </span>
                  </div>
                )}
                {viewingTask.nextReviewDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Review</span>
                    <span className="text-primary">
                      {formatDate(viewingTask.nextReviewDate)}
                    </span>
                  </div>
                )}
                {viewingTask.completeDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="text-primary">
                      {formatDate(viewingTask.completeDate)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className={BTN.CANCEL}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateTaskOpen}
        onOpenChange={(open) => {
          setIsCreateTaskOpen(open);
          if (!open)
            setCreateForm({
              name: '',
              description: '',
              memberId: '',
              taskType: '1',
              sectionId: '',
              status: '1',
              startDate: '',
              nextReviewDate: '',
              completeDate: '',
            });
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create a task for this paper</DialogDescription>
          </DialogHeader>
          <form
            id="create-task-form"
            onSubmit={handleCreateTask}
            className="scrollbar-dialog grid flex-1 gap-4 overflow-y-auto px-1 py-2 sm:grid-cols-2"
          >
            {/* Task Type — shown first */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="createTaskType"
                className="text-secondary font-sans text-[10px]"
              >
                Task Type *
              </label>
              <select
                id="createTaskType"
                className="border-surface-container-highest text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={createForm.taskType}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    taskType: e.target.value,
                    sectionId: '',
                  }))
                }
                required
              >
                {TASK_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={String(t.value)}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Section — only shown for Writing tasks */}
            {createForm.taskType === '2' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="createTaskSection"
                  className="text-secondary font-sans text-[10px]"
                >
                  Section
                </label>
                <select
                  id="createTaskSection"
                  className="border-surface-container-highest text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  value={createForm.sectionId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      sectionId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select section</option>
                  {sectionOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Task Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="createTaskName"
                className="text-secondary font-sans text-[10px]"
              >
                Task Name *
              </label>
              <Input
                id="createTaskName"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="createTaskDesc"
                className="text-secondary font-sans text-[10px]"
              >
                Description
              </label>
              <textarea
                id="createTaskDesc"
                className="border-surface-container-highest text-primary focus-visible:ring-ring min-h-22.5 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Assignee (memberId) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="createTaskAssignee"
                className="text-secondary font-sans text-[10px]"
              >
                Assign Member *
              </label>
              <select
                id="createTaskAssignee"
                className="border-surface-container-highest text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={createForm.memberId}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    memberId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select assignee</option>
                {createMemberOptions.map((member) => (
                  <option key={member.value} value={member.value}>
                    {member.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label
                htmlFor="createTaskStatus"
                className="text-secondary font-sans text-[10px]"
              >
                Status
              </label>
              <select
                id="createTaskStatus"
                className="border-surface-container-highest text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                {PAPER_TASK_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={String(status.value)}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="createTaskStart"
                className="text-secondary font-sans text-[10px]"
              >
                Start Date
              </label>
              <Input
                id="createTaskStart"
                type="datetime-local"
                value={createForm.startDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Next Review Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="createTaskNextReview"
                className="text-secondary font-sans text-[10px]"
              >
                Next Review Date
              </label>
              <Input
                id="createTaskNextReview"
                type="datetime-local"
                value={createForm.nextReviewDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    nextReviewDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Complete Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="createTaskComplete"
                className="text-secondary font-sans text-[10px]"
              >
                Complete Date
              </label>
              <Input
                id="createTaskComplete"
                type="datetime-local"
                value={createForm.completeDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    completeDate: e.target.value,
                  }))
                }
              />
            </div>
          </form>
          <DialogFooter className="gap-2 px-1 pb-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className={BTN.CANCEL}>
                CANCEL
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="create-task-form"
              className={BTN.CREATE}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'CREATING...' : 'CREATE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent className="scrollbar-dialog flex max-h-[90vh] w-full flex-col overflow-hidden sm:max-w-xl">
          <form
            onSubmit={handleUpdateTask}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <DialogHeader className="shrink-0 pr-8">
              <DialogTitle>Update Task</DialogTitle>
              <DialogDescription>
                {isPaperAuthor
                  ? 'Update task details'
                  : 'Only status and your date fields can be updated'}
              </DialogDescription>
            </DialogHeader>

            <div className="scrollbar-dialog min-h-0 flex-1 space-y-4 overflow-y-auto py-4 pr-1">
              {!isPaperAuthor && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-secondary font-sans text-[10px]">
                      Task Name
                    </p>
                    <Input
                      value={editingTask?.name ?? ''}
                      readOnly
                      className="bg-surface-container text-secondary cursor-not-allowed"
                    />
                  </div>

                  {editingTask?.description && (
                    <div className="space-y-1.5">
                      <p className="text-secondary font-sans text-[10px]">
                        Description
                      </p>
                      <p className="text-secondary bg-surface-container rounded-md border px-3 py-2 text-sm">
                        {editingTask.description}
                      </p>
                    </div>
                  )}
                </>
              )}

              {isPaperAuthor && (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="updateTaskName"
                      className="text-secondary font-sans text-[10px]"
                    >
                      Task Name
                    </label>
                    <Input
                      id="updateTaskName"
                      value={updateForm.name}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="updateTaskDesc"
                      className="text-secondary font-sans text-[10px]"
                    >
                      Description
                    </label>
                    <textarea
                      id="updateTaskDesc"
                      className="border-surface-container-highest text-primary focus-visible:ring-ring min-h-22.5 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                      value={updateForm.description}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-secondary font-sans text-[10px]">
                      Assigned Member
                    </p>
                    <Input
                      value={updateForm.assignedToUserName}
                      readOnly
                      className="bg-surface-container text-secondary cursor-not-allowed"
                    />
                  </div>
                </>
              )}

              {editingTask?.sectionTitle && (
                <div className="space-y-1.5">
                  <p className="text-secondary font-sans text-[10px]">
                    Section
                  </p>
                  <Input
                    value={editingTask.sectionTitle}
                    readOnly
                    className="bg-surface-container text-secondary cursor-not-allowed"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="updateTaskStatus"
                  className="text-secondary font-sans text-[10px]"
                >
                  Status
                </label>
                <select
                  id="updateTaskStatus"
                  className="focus-visible:border-ring focus-visible:ring-ring/50 border-input h-9 w-full cursor-pointer rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                  value={updateForm.status}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {PAPER_TASK_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={String(status.value)}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="updateTaskStart"
                  className="text-secondary font-sans text-[10px]"
                >
                  Start Date
                </label>
                <Input
                  id="updateTaskStart"
                  type="datetime-local"
                  value={updateForm.startDate}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="updateTaskNextReview"
                  className="text-secondary font-sans text-[10px]"
                >
                  Next Review Date
                </label>
                <Input
                  id="updateTaskNextReview"
                  type="datetime-local"
                  value={updateForm.nextReviewDate}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      nextReviewDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="shrink-0">
              <div className="flex w-full items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={BTN.CANCEL}
                  onClick={() => setEditingTask(null)}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  className={cn('flex-1', BTN.CREATE)}
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? 'UPDATING...' : 'UPDATE'}
                </Button>
                {isPaperAuthor && (
                  <Button
                    type="button"
                    variant="outline"
                    className={BTN.DANGER}
                    disabled={deleteTaskMutation.isPending}
                    onClick={() => {
                      if (editingTask) setDeletingTask(editingTask);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deletingTask?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={BTN.CANCEL}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={BTN.DANGER}
              disabled={deleteTaskMutation.isPending}
              onClick={() => {
                if (!deletingTask) return;
                handleDeleteTask(deletingTask.id);
                setDeletingTask(null);
                setEditingTask(null);
              }}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Remove Contributor Confirm ─────────────────────────────── */}
      <AlertDialog
        open={!!confirmDeleteMemberId}
        onOpenChange={(o) => {
          if (!o) setConfirmDeleteMemberId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contributor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this contributor from the paper?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={BTN.CANCEL}
              onClick={() => setConfirmDeleteMemberId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={BTN.DANGER}
              disabled={removePaperMemberMutation.isPending}
              onClick={() => {
                if (!confirmDeleteMemberId) return;
                removePaperMemberMutation.mutate({
                  memberIds: [confirmDeleteMemberId],
                });
                setConfirmDeleteMemberId(null);
              }}
            >
              {removePaperMemberMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaperMembersDialog
        subProjectId={paperSubProjectId}
        isManager={isManager}
        isAuthor={isPaperAuthor}
        paperTitle={paper.title || 'Untitled'}
        open={isMembersOpen}
        onOpenChange={setIsMembersOpen}
      />

      {/* ── Edit Paper Dialog (author only) ───────────────────────── */}
      <Dialog open={isEditPaperOpen} onOpenChange={setIsEditPaperOpen}>
        <DialogContent className="scrollbar-dialog flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Paper</DialogTitle>
            <DialogDescription>
              Update the paper details below.
            </DialogDescription>
          </DialogHeader>

          <form
            id="edit-paper-form"
            onSubmit={handleEditPaperSubmit}
            className="scrollbar-dialog min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            <div className="space-y-1.5">
              <label htmlFor="ep-context" className="text-sm font-medium">
                Context <span className="text-destructive">*</span>
              </label>
              <textarea
                id="ep-context"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-24 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.context}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    context: e.target.value,
                  }))
                }
                placeholder="Enter paper context"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ep-abstract" className="text-sm font-medium">
                Abstract <span className="text-destructive">*</span>
              </label>
              <textarea
                id="ep-abstract"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.abstract}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    abstract: e.target.value,
                  }))
                }
                placeholder="Enter abstract"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ep-research-gap" className="text-sm font-medium">
                Research Gap <span className="text-destructive">*</span>
              </label>
              <textarea
                id="ep-research-gap"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.researchGap}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    researchGap: e.target.value,
                  }))
                }
                placeholder="Enter research gap"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ep-gap-type" className="text-sm font-medium">
                Gap Type <span className="text-destructive">*</span>
              </label>
              <Input
                id="ep-gap-type"
                value={editPaperForm.gapType}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    gapType: e.target.value,
                  }))
                }
                placeholder="e.g. Methodological, Empirical"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ep-research-aim" className="text-sm font-medium">
                Research Aim <span className="text-destructive">*</span>
              </label>
              <textarea
                id="ep-research-aim"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.researchAim}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    researchAim: e.target.value,
                  }))
                }
                placeholder="Enter research aim"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ep-main-contribution"
                className="text-sm font-medium"
              >
                Main Contribution <span className="text-destructive">*</span>
              </label>
              <textarea
                id="ep-main-contribution"
                className="border-surface-container-highest bg-surface text-primary ring-offset-background placeholder:text-secondary focus-visible:ring-ring flex min-h-20 w-full max-w-full resize-y rounded-md border px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={editPaperForm.mainContribution}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    mainContribution: e.target.value,
                  }))
                }
                placeholder="Enter main contribution"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ep-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="ep-status"
                className="border-surface-container-highest bg-surface text-primary focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={editPaperForm.status}
                onChange={(e) =>
                  setEditPaperForm((prev) => ({
                    ...prev,
                    status: Number(e.target.value),
                  }))
                }
              >
                {PAPER_INITIALIZE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Journal</p>
              <div className="min-w-0 space-y-1.5">
                <label htmlFor="ep-journal-id" className="text-sm font-medium">
                  Select Journal
                </label>
                <select
                  id="ep-journal-id"
                  className="border-surface-container-highest bg-surface text-primary focus-visible:ring-ring flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  value={editPaperForm.selectedJournalId}
                  onChange={(e) =>
                    setEditPaperForm((prev) => ({
                      ...prev,
                      selectedJournalId: e.target.value,
                      conferenceJournalStartAt: toDateTimeLocalValue(
                        journalResults.find(
                          (journal) => journal.id === e.target.value,
                        )?.conferenceJournalStartAt,
                      ),
                      conferenceJournalEndAt: toDateTimeLocalValue(
                        journalResults.find(
                          (journal) => journal.id === e.target.value,
                        )?.conferenceJournalEndAt,
                      ),
                    }))
                  }
                >
                  <option value="">No journal</option>
                  {journalResults.map((journal) => (
                    <option key={journal.id} value={journal.id}>
                      {journal.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label
                    htmlFor="ep-conference-journal-start-at"
                    className="text-sm font-medium"
                  >
                    Conference / Journal Start
                  </label>
                  <Input
                    id="ep-conference-journal-start-at"
                    type="datetime-local"
                    value={editPaperForm.conferenceJournalStartAt}
                    onChange={(e) =>
                      setEditPaperForm((prev) => ({
                        ...prev,
                        conferenceJournalStartAt: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <label
                    htmlFor="ep-conference-journal-end-at"
                    className="text-sm font-medium"
                  >
                    Conference / Journal End
                  </label>
                  <Input
                    id="ep-conference-journal-end-at"
                    type="datetime-local"
                    value={editPaperForm.conferenceJournalEndAt}
                    onChange={(e) =>
                      setEditPaperForm((prev) => ({
                        ...prev,
                        conferenceJournalEndAt: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              className={BTN.CANCEL}
              onClick={() => setIsEditPaperOpen(false)}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              form="edit-paper-form"
              className={BTN.CREATE}
              disabled={updateWritingPaperMutation.isPending}
            >
              {updateWritingPaperMutation.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentLayout>
  );
};
