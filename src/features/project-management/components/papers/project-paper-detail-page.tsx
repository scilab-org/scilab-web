import { FormEvent, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  RefreshCw,
  Search,
  User,
  Users,
  X,
  Trash2,
  FileText,
  Target,
  BookOpen,
  Globe,
  PenTool,
  ClipboardList,
  Hash,
  Calendar,
  Presentation,
  LayoutTemplate,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { formatPublicationDate } from '@/utils/string-utils';
import { useUser } from '@/lib/auth';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { PAPER_STATUS_MAP } from '@/features/paper-management/constants';
import { usePaperMembers } from '@/features/project-management/api/papers/get-paper-members';
import { useSubProjects } from '@/features/project-management/api/papers/get-sub-projects';
import { ProjectMember } from '@/features/project-management/types';
import { PaperMembersSheet } from '@/features/project-management/components/papers/paper-members-sheet';
import {
  useCreateTask,
  usePaperTasks,
  useUpdateTask,
  useDeleteTask,
} from '@/features/task-management/api';
import {
  DATE_TASK_FILTER_OPTIONS,
  TASK_MANAGEMENT_QUERY_KEYS,
  TASK_STATUS_OPTIONS,
  AUTHOR_TASK_STATUS_OPTIONS,
} from '@/features/task-management/constants';
import {
  DateTaskFilterField,
  TaskItem,
} from '@/features/task-management/types';

// Kanban column definitions
const KANBAN_COLUMNS = [
  {
    status: 1,
    label: 'To Do',
    dot: 'bg-slate-400',
    headerCls:
      'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60',
    bodyCls:
      'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/20',
    countCls:
      'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    labelCls: 'text-slate-700 dark:text-slate-300',
  },
  {
    status: 2,
    label: 'In Progress',
    dot: 'bg-blue-500',
    headerCls:
      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30',
    bodyCls:
      'border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-900/10',
    countCls:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    labelCls: 'text-blue-700 dark:text-blue-300',
  },
  {
    status: 3,
    label: 'In Review',
    dot: 'bg-amber-500',
    headerCls:
      'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30',
    bodyCls:
      'border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-900/10',
    countCls:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    labelCls: 'text-amber-700 dark:text-amber-300',
  },
  {
    status: 4,
    label: 'Completed',
    dot: 'bg-green-500',
    headerCls:
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30',
    bodyCls:
      'border-green-200 bg-green-50/40 dark:border-green-800 dark:bg-green-900/10',
    countCls:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    labelCls: 'text-green-700 dark:text-green-300',
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

export const ProjectPaperDetailPage = ({
  projectId,
  paperId,
  isAuthor = false,
  isManager = false,
  backPath,
  workspacePath,
}: {
  projectId: string;
  paperId: string;
  isAuthor?: boolean;
  isManager?: boolean;
  backPath: string;
  workspacePath?: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const paperQuery = useWritingPaperDetail({ paperId });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
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
    assignedToUserName: '',
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
    paper?.subProjectId || matchedSubProject?.subProjectId || '';
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
  const currentUsername = (user?.preferredUsername || '').trim().toLowerCase();

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

  const createTaskMutation = useCreateTask({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Task created successfully');
        setIsCreateTaskOpen(false);
        setCreateForm({
          name: '',
          description: '',
          assignedToUserName: '',
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
      onError: () => toast.error('Failed to update task'),
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
          assignedToUserName: task.assignedToUserName,
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
        onError: () => {
          dndMutatingRef.current.delete(task.id);
          // Revert optimistic update
          setLocalStatusOverrides((prev) => {
            const next = { ...prev };
            delete next[task.id];
            return next;
          });
          toast.error('Failed to update task status');
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
      assignedToUserName: task.assignedToUserName,
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
    if (!createForm.name || !createForm.assignedToUserName) {
      toast.error('Task name and assignee are required');
      return;
    }

    createTaskMutation.mutate({
      paperId,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      assignedToUserName: createForm.assignedToUserName.trim(),
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
        name: isAuthor ? updateForm.name : editingTask.name,
        description: isAuthor
          ? updateForm.description
          : editingTask.description || '',
        assignedToUserName: isAuthor
          ? updateForm.assignedToUserName
          : editingTask.assignedToUserName,
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
          <p className="text-muted-foreground">Paper not found</p>
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
        <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between border-b bg-linear-to-r from-slate-50 to-blue-50/40 px-6 py-4 dark:from-slate-900/40 dark:to-blue-950/20">
            <div>
              <h1 className="text-foreground text-2xl leading-tight font-bold">
                {paper.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {paperType && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FileText className="size-3" />
                    {paperType}
                  </Badge>
                )}
                <Badge
                  className={cn(
                    'text-xs',
                    paper.status === 1
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                      : paper.status === 2
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300'
                        : paper.status === 3
                          ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300',
                  )}
                >
                  {PAPER_STATUS_MAP[paper.status] || 'Unknown'}
                </Badge>
                {paper.template && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <LayoutTemplate className="size-3" />
                    {paper.template}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {paper.createdBy && (
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    Created by{' '}
                    <span className="text-foreground font-medium">
                      {paper.createdBy}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsMembersOpen(true)}
                  className="gap-1.5"
                >
                  <Users className="size-4" />
                  Members
                </Button>
                {workspacePath && (
                  <Button
                    size="sm"
                    onClick={() => navigate(workspacePath)}
                    className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    <ExternalLink className="size-4" />
                    Open Workspace
                  </Button>
                )}
                {paper.filePath && (
                  <a
                    href={paper.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <ExternalLink className="size-3" />
                    View PDF
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* Paper detail grid */}
          <div className="p-6">
            {/* Quick info row */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(paper as any).doi && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/30">
                    <Hash className="size-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      DOI
                    </p>
                    <p className="text-foreground text-sm font-medium">
                      {(paper as any).doi}
                    </p>
                  </div>
                </div>
              )}
              {(paper.journalName || (paper as any).journal) && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30">
                    <BookOpen className="size-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      Journal
                    </p>
                    <p className="text-foreground text-sm font-medium">
                      {paper.journalName || (paper as any).journal}
                    </p>
                  </div>
                </div>
              )}
              {(paper as any).conferenceName && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                    <Presentation className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      Conference
                    </p>
                    <p className="text-foreground text-sm font-medium">
                      {(paper as any).conferenceName}
                    </p>
                  </div>
                </div>
              )}
              {(paper as any).publicationDate && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pink-100 dark:bg-pink-900/30">
                    <Calendar className="size-3.5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      Published
                    </p>
                    <p className="text-foreground text-sm font-medium">
                      {formatPublicationDate((paper as any).publicationDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Abstract full width */}
            <div className="bg-muted/20 mb-4 rounded-xl border p-5 transition-shadow hover:shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/60 dark:bg-blue-900/30">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Abstract
                </h3>
              </div>
              <p className="text-foreground/90 text-[14px] leading-relaxed whitespace-pre-wrap">
                {paper.abstract || 'No abstract provided.'}
              </p>
            </div>

            {/* Remaining metadata grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-muted/20 rounded-xl border p-5 transition-shadow hover:shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/60 dark:bg-emerald-900/30">
                    <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Main Contribution
                  </h3>
                </div>
                <p className="text-foreground/90 text-[14px] leading-relaxed whitespace-pre-wrap">
                  {paper.mainContribution || 'No main contribution listed.'}
                </p>
              </div>

              <div className="bg-muted/20 rounded-xl border p-5 transition-shadow hover:shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100/60 dark:bg-indigo-900/30">
                    <Globe className="size-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Context
                  </h3>
                </div>
                <p className="text-foreground/90 text-[14px] leading-relaxed whitespace-pre-wrap">
                  {paper.context || 'No context defined.'}
                </p>
              </div>

              <div className="bg-muted/20 rounded-xl border p-5 transition-shadow hover:shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100/60 dark:bg-orange-900/30">
                    <Target className="size-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Research Gap
                  </h3>
                </div>
                <p className="text-foreground/90 text-[14px] leading-relaxed whitespace-pre-wrap">
                  {paper.researchGap || 'No research gap explicitly stated.'}
                </p>
                {paper.gapType && (
                  <span className="bg-muted/60 text-muted-foreground mt-3 inline-block rounded-md px-2.5 py-0.5 text-xs font-medium">
                    Type: {paper.gapType}
                  </span>
                )}
              </div>

              {(paper.styleName || paper.styleDescription) && (
                <div className="bg-muted/20 rounded-xl border p-5 transition-shadow hover:shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100/60 dark:bg-violet-900/30">
                      <PenTool className="size-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Style Guidelines
                    </h3>
                  </div>
                  {paper.styleName && (
                    <p className="text-foreground text-[14px] font-medium">
                      {paper.styleName}
                    </p>
                  )}
                  {paper.styleDescription && (
                    <p className="text-foreground/80 mt-1 text-[14px] leading-relaxed">
                      {paper.styleDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tasks Panel ─────────────────────────────────────────────── */}
        <div className="border-border bg-card rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100/60 dark:bg-amber-900/30">
              <ClipboardList className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold">Tasks</h2>
              <p className="text-muted-foreground text-xs">
                {paperTasksQuery.data?.result?.paging?.totalCount != null
                  ? `${paperTasksQuery.data.result.paging.totalCount} task${paperTasksQuery.data.result.paging.totalCount !== 1 ? 's' : ''}`
                  : 'Paper tasks'}
              </p>
            </div>
            <Button
              className={cn('ml-auto', BTN.CREATE)}
              size="sm"
              onClick={() => {
                if (!isAuthor && user?.preferredUsername) {
                  setCreateForm((prev) => ({
                    ...prev,
                    assignedToUserName: user.preferredUsername || '',
                  }));
                }
                setIsCreateTaskOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => paperTasksQuery.refetch()}
              disabled={paperTasksQuery.isFetching}
              title="Refresh tasks"
            >
              <RefreshCw
                className={cn(
                  'size-4',
                  paperTasksQuery.isFetching && 'animate-spin',
                )}
              />
            </Button>
          </div>

          <div className="p-4">
            <form
              onSubmit={applyTaskFilters}
              className="bg-muted/40 mb-4 rounded-xl border p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="filterAssignee"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Assignee
                  </label>
                  <select
                    id="filterAssignee"
                    className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    value={localFilters.AssignedToUserName}
                    onChange={(e) =>
                      handleFilterChange('AssignedToUserName', e.target.value)
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
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Status
                  </label>
                  <select
                    id="filterStatus"
                    className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    value={localFilters.Status}
                    onChange={(e) =>
                      handleFilterChange('Status', e.target.value)
                    }
                  >
                    <option value="">All Status</option>
                    {TASK_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={String(status.value)}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="filterDateField"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Date Field
                  </label>
                  <select
                    id="filterDateField"
                    className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
                    className="text-muted-foreground text-xs font-medium"
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
                    className="text-muted-foreground text-xs font-medium"
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
                    size="sm"
                    onClick={clearTaskFilters}
                    className="text-muted-foreground hover:text-foreground mr-auto"
                  >
                    <X className="size-4" />
                    Clear ({activeFilterCount})
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearTaskFilters}
                  className={BTN.CANCEL}
                >
                  Reset
                </Button>
                <Button type="submit" size="sm" className={BTN.EDIT}>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {KANBAN_COLUMNS.map((col) => {
                  const allItems = paperTasksQuery.data?.result?.items ?? [];
                  const colTasks = allItems
                    .map((t) => ({
                      ...t,
                      status: localStatusOverrides[t.id] ?? t.status,
                    }))
                    .filter((t) => t.status === col.status);
                  const isDragTarget = dragOverCol === col.status;
                  return (
                    <div key={col.status} className="flex min-w-0 flex-col">
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
                            'ring-2 ring-blue-400 ring-inset dark:ring-blue-500',
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
                            !e.currentTarget.contains(e.relatedTarget as Node)
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
                          // Don't clear draggedTaskId here — let onDragEnd do it
                          // so the optimistic override and drag-clear happen in the
                          // same render, preventing a flash back to the old column
                          handleTaskDrop(task, col.status);
                        }}
                      >
                        {colTasks.length === 0 ? (
                          <div
                            className={cn(
                              'flex h-24 items-center justify-center rounded-md border-2 border-dashed transition-colors duration-150',
                              isDragTarget
                                ? 'border-blue-400 bg-blue-50/60 dark:border-blue-600 dark:bg-blue-900/20'
                                : 'border-transparent',
                            )}
                          >
                            <p className="text-muted-foreground text-xs">
                              {isDragTarget ? 'Drop here' : 'No tasks'}
                            </p>
                          </div>
                        ) : (
                          colTasks.map((task) => {
                            const canEdit =
                              isAuthor ||
                              (currentUsername &&
                                task.assignedToUserName.toLowerCase() ===
                                  currentUsername);
                            const isPending = dndMutatingRef.current.has(
                              task.id,
                            );
                            return (
                              <div
                                key={task.id}
                                draggable
                                role="button"
                                tabIndex={canEdit ? 0 : -1}
                                onDragStart={(e) => {
                                  setDraggedTaskId(task.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  // needed for Firefox
                                  e.dataTransfer.setData('text/plain', task.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedTaskId(null);
                                  setDragOverCol(null);
                                }}
                                onClick={() => canEdit && openUpdateTask(task)}
                                onKeyDown={(e) => {
                                  if (!canEdit) return;
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openUpdateTask(task);
                                  }
                                }}
                                className={cn(
                                  'bg-card relative flex flex-col gap-2 rounded-lg border p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
                                  canEdit && 'cursor-pointer',
                                  isPending &&
                                    'ring-1 ring-blue-400 dark:ring-blue-500',
                                )}
                              >
                                {/* Pending indicator (while mutation is in flight) */}
                                {isPending && (
                                  <span className="absolute top-2 right-2 inline-flex size-2 animate-pulse rounded-full bg-blue-400" />
                                )}

                                {/* Name */}
                                <p className="pr-4 text-sm leading-snug font-medium">
                                  {task.name}
                                </p>

                                {/* Description */}
                                {task.description && (
                                  <p className="text-muted-foreground line-clamp-2 text-xs">
                                    {task.description}
                                  </p>
                                )}

                                {/* Assignee */}
                                <div className="flex items-center gap-1.5">
                                  <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
                                    {task.assignedToUserName.charAt(0)}
                                  </div>
                                  <span className="text-muted-foreground truncate text-xs">
                                    {task.assignedToUserName}
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
                                          Start: {formatDate(task.startDate)}
                                        </span>
                                      </div>
                                    )}
                                    {task.nextReviewDate && (
                                      <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                        <Calendar className="size-3 shrink-0" />
                                        <span>
                                          Review:{' '}
                                          {formatDate(task.nextReviewDate)}
                                        </span>
                                      </div>
                                    )}
                                    {task.completeDate && (
                                      <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                        <Calendar className="size-3 shrink-0" />
                                        <span>
                                          Due: {formatDate(task.completeDate)}
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
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-sm">
          <form onSubmit={handleCreateTask} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Create Task</SheetTitle>
              <SheetDescription>Create a task for this paper</SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4 pr-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskName"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Task Name
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

              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskDesc"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Description
                </label>
                <textarea
                  id="createTaskDesc"
                  className="border-input bg-background focus-visible:ring-ring min-h-22.5 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskAssignee"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Assign Username
                </label>
                {isAuthor ? (
                  <select
                    id="createTaskAssignee"
                    className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    value={createForm.assignedToUserName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        assignedToUserName: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select assignee</option>
                    {memberOptions.map((member) => (
                      <option key={member.value} value={member.value}>
                        {member.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="createTaskAssignee"
                    value={createForm.assignedToUserName}
                    readOnly
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskStatus"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Status
                </label>
                <select
                  id="createTaskStatus"
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {TASK_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={String(status.value)}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskStart"
                  className="text-muted-foreground text-xs font-medium"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskNextReview"
                  className="text-muted-foreground text-xs font-medium"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="createTaskComplete"
                  className="text-muted-foreground text-xs font-medium"
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
            </div>

            <SheetFooter className="shrink-0">
              <SheetClose asChild>
                <Button type="button" variant="outline" className={BTN.CANCEL}>
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                className={BTN.CREATE}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <SheetContent className="flex w-full flex-col sm:max-w-sm">
          <form onSubmit={handleUpdateTask} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Update Task</SheetTitle>
              <SheetDescription>
                {isAuthor
                  ? 'Update task details'
                  : 'Only status and your date fields can be updated'}
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4 pr-1">
              {!isAuthor && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium">
                      Task Name
                    </p>
                    <Input
                      value={editingTask?.name ?? ''}
                      readOnly
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  {editingTask?.description && (
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs font-medium">
                        Description
                      </p>
                      <p className="text-muted-foreground bg-muted/50 rounded-md border px-3 py-2 text-sm">
                        {editingTask.description}
                      </p>
                    </div>
                  )}
                </>
              )}

              {isAuthor && (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="updateTaskName"
                      className="text-muted-foreground text-xs font-medium"
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
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Description
                    </label>
                    <textarea
                      id="updateTaskDesc"
                      className="border-input bg-background focus-visible:ring-ring min-h-22.5 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
                    <label
                      htmlFor="updateTaskAssignee"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Assign Username
                    </label>
                    <select
                      id="updateTaskAssignee"
                      className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                      value={updateForm.assignedToUserName}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          assignedToUserName: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select assignee</option>
                      {memberOptions.map((member) => (
                        <option key={member.value} value={member.value}>
                          {member.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="updateTaskStatus"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Status
                </label>
                <select
                  id="updateTaskStatus"
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  value={updateForm.status}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {(isAuthor
                    ? AUTHOR_TASK_STATUS_OPTIONS
                    : TASK_STATUS_OPTIONS
                  ).map((status) => (
                    <option key={status.value} value={String(status.value)}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="updateTaskStart"
                  className="text-muted-foreground text-xs font-medium"
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
                  className="text-muted-foreground text-xs font-medium"
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

            <SheetFooter className="shrink-0">
              <div className="flex w-full items-center gap-2">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={BTN.CANCEL}
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  className={cn('flex-1', BTN.EDIT)}
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
                {isAuthor && (
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
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

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

      <PaperMembersSheet
        subProjectId={paperSubProjectId}
        isManager={isManager}
        isAuthor={isAuthor}
        paperTitle={paper.title || 'Untitled'}
        open={isMembersOpen}
        onOpenChange={setIsMembersOpen}
      />
    </ContentLayout>
  );
};
