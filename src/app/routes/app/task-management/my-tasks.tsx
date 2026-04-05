import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Trash2,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/layouts';

import { Button } from '@/components/ui/button';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

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
import { useUser } from '@/lib/auth';
import {
  getMyTasksQueryOptions,
  useMyAssignedPapers,
  useCreateTask,
  useDeleteTask,
  useMyTasks,
  useUpdateTask,
} from '@/features/task-management/api';
import {
  DATE_TASK_FILTER_OPTIONS,
  TASK_MANAGEMENT_QUERY_KEYS,
  TASK_STATUS_OPTIONS,
} from '@/features/task-management/constants';
import { cn } from '@/utils/cn';
import {
  DateTaskFilterField,
  GetMyTasksParams,
  TaskItem,
  UpdateTaskDto,
} from '@/features/task-management/types';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const query = getMyTasksQueryOptions({
      PageNumber: Number(url.searchParams.get('page') || 1),
      PageSize: Number(url.searchParams.get('pageSize') || 10),
      AssignedToUserName:
        url.searchParams.get('AssignedToUserName') || undefined,
      Status: url.searchParams.get('Status') || undefined,
      PaperId: url.searchParams.get('PaperId') || undefined,
      DateField:
        (url.searchParams.get('DateField') as DateTaskFilterField | null) ??
        undefined,
      FromDate: url.searchParams.get('FromDate') || undefined,
      ToDate: url.searchParams.get('ToDate') || undefined,
    });

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

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

type TaskFormState = {
  paperId: string;
  name: string;
  description: string;
  assignedToUserName: string;
  status: string;
  startDate: string;
  nextReviewDate: string;
  completeDate: string;
};

const createInitialTaskForm = (): TaskFormState => ({
  paperId: '',
  name: '',
  description: '',
  assignedToUserName: '',
  status: '1',
  startDate: '',
  nextReviewDate: '',
  completeDate: '',
});

const MyTasksRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [createForm, setCreateForm] = useState<TaskFormState>(
    createInitialTaskForm,
  );
  const [updateForm, setUpdateForm] = useState<TaskFormState>(
    createInitialTaskForm,
  );
  const [paperFilterSearch, setPaperFilterSearch] = useState('');
  const [paperFilterOpen, setPaperFilterOpen] = useState(false);
  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, number>
  >({});
  const dndMutatingRef = useRef<Set<string>>(new Set());
  const { data: user } = useUser();
  const currentUsername = (user?.preferredUsername || '').trim().toLowerCase();

  // Auto-fill assigned username when opening create dialog
  useEffect(() => {
    if (isCreateOpen && user?.preferredUsername) {
      setCreateForm((prev) => ({
        ...prev,
        assignedToUserName: user.preferredUsername || '',
      }));
    }
  }, [isCreateOpen, user]);

  const [localFilters, setLocalFilters] = useState({
    Status: searchParams.get('Status') || '',
    PaperId: searchParams.get('PaperId') || '',
    DateField:
      (searchParams.get('DateField') as DateTaskFilterField | null) || '',
    FromDate: searchParams.get('FromDate') || '',
    ToDate: searchParams.get('ToDate') || '',
  });

  const assignedPapersQuery = useMyAssignedPapers({
    params: { PageNumber: 1, PageSize: 1000 },
  });
  const assignedPapers = useMemo(
    () => assignedPapersQuery.data?.result?.items ?? [],
    [assignedPapersQuery.data?.result?.items],
  );
  const isDateFieldSelected = Boolean(localFilters.DateField);
  const selectedPaperLabel = useMemo(() => {
    if (!localFilters.PaperId) return 'All Papers';
    return (
      assignedPapers.find((paper) => paper.id === localFilters.PaperId)
        ?.title || 'All Papers'
    );
  }, [assignedPapers, localFilters.PaperId]);
  const filteredPaperOptions = useMemo(() => {
    const keyword = paperFilterSearch.trim().toLowerCase();
    if (!keyword) return assignedPapers;
    return assignedPapers.filter((paper) =>
      paper.title.toLowerCase().includes(keyword),
    );
  }, [assignedPapers, paperFilterSearch]);

  const queryParams: GetMyTasksParams = {
    PageNumber: 1,
    PageSize: 200,
    AssignedToUserName: undefined,
    Status: searchParams.get('Status') || undefined,
    PaperId: searchParams.get('PaperId') || undefined,
    DateField: (searchParams.get('DateField') || undefined) as
      | DateTaskFilterField
      | undefined,
    FromDate: searchParams.get('FromDate') || undefined,
    ToDate: searchParams.get('ToDate') || undefined,
  };

  const tasksQuery = useMyTasks({ params: queryParams });
  const items: TaskItem[] = tasksQuery.data?.result?.items ?? [];

  const createTaskMutation = useCreateTask({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Task created successfully');
        setIsCreateOpen(false);
        setCreateForm(createInitialTaskForm());
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
          queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_TASKS],
        });
      },
      onError: () => toast.error('Failed to update task'),
    },
  });

  const deleteTaskMutation = useDeleteTask({
    mutationConfig: {
      onSuccess: () => {
        toast.success('Task deleted successfully');
        setDeletingTask(null);
      },
      onError: () => toast.error('Failed to delete task'),
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters((prev) => {
      if (key === 'DateField' && !value) {
        return {
          ...prev,
          DateField: '',
          FromDate: '',
          ToDate: '',
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const applyFilters = (e?: FormEvent) => {
    e?.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(localFilters).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      return next;
    });
  };

  const clearFilters = () => {
    setLocalFilters({
      Status: '',
      PaperId: '',
      DateField: '',
      FromDate: '',
      ToDate: '',
    });
    setSearchParams({});
  };

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (
      !createForm.paperId ||
      !createForm.name ||
      !createForm.assignedToUserName
    ) {
      toast.error('Paper name, task name and assignee are required');
      return;
    }

    createTaskMutation.mutate({
      paperId: createForm.paperId.trim(),
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

  const openEdit = (task: TaskItem) => {
    setEditingTask(task);
    setUpdateForm({
      paperId: task.paperId,
      name: task.name,
      description: task.description || '',
      assignedToUserName: task.assignedToUserName,
      status: String(task.status),
      startDate: toDateTimeLocalValue(task.startDate),
      nextReviewDate: toDateTimeLocalValue(task.nextReviewDate),
      completeDate: toDateTimeLocalValue(task.completeDate),
    });
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const isOwnedTask =
      !!currentUsername &&
      (editingTask.createdBy || '').trim().toLowerCase() === currentUsername;
    if (!updateForm.name || !updateForm.assignedToUserName) {
      toast.error('Task name and assignee are required');
      return;
    }

    const payload: UpdateTaskDto = {
      name: isOwnedTask ? updateForm.name.trim() : editingTask.name,
      description: isOwnedTask
        ? updateForm.description.trim()
        : editingTask.description || '',
      assignedToUserName: isOwnedTask
        ? updateForm.assignedToUserName.trim()
        : editingTask.assignedToUserName,
      status: Number(updateForm.status),
      startDate: updateForm.startDate
        ? new Date(updateForm.startDate).toISOString()
        : new Date().toISOString(),
      nextReviewDate: updateForm.nextReviewDate
        ? new Date(updateForm.nextReviewDate).toISOString()
        : null,
    };

    updateTaskMutation.mutate({ id: editingTask.id, data: payload });
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
          queryClient
            .refetchQueries({
              queryKey: [TASK_MANAGEMENT_QUERY_KEYS.MY_TASKS],
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

  return (
    <ContentLayout
      title="My Task"
      description="Track, filter and manage your paper tasks"
    >
      <div className="mb-4 flex items-center justify-end">
        <Button className={BTN.CREATE} onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Create Task
        </Button>
      </div>

      <form
        onSubmit={applyFilters}
        className="bg-muted/40 mb-6 rounded-xl border p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
          <div className="space-y-1.5 xl:col-span-4">
            <p className="text-muted-foreground text-xs font-medium">
              Paper Name
            </p>
            <Popover open={paperFilterOpen} onOpenChange={setPaperFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-between px-3 py-1 text-sm font-normal"
                >
                  <span className="truncate">{selectedPaperLabel}</span>
                  <ChevronDown className="size-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-2"
              >
                <Input
                  placeholder="Type to filter paper..."
                  value={paperFilterSearch}
                  onChange={(e) => setPaperFilterSearch(e.target.value)}
                  className="mb-2 h-8"
                />
                <div className="max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    className={`hover:bg-accent flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${localFilters.PaperId === '' ? 'bg-accent' : ''}`}
                    onClick={() => {
                      handleFilterChange('PaperId', '');
                      setPaperFilterOpen(false);
                    }}
                  >
                    <span>All Papers</span>
                    {localFilters.PaperId === '' && (
                      <Check className="size-4" />
                    )}
                  </button>
                  {filteredPaperOptions.length > 0 ? (
                    filteredPaperOptions.map((paper) => (
                      <button
                        key={paper.id}
                        type="button"
                        className={`hover:bg-accent flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${localFilters.PaperId === paper.id ? 'bg-accent' : ''}`}
                        onClick={() => {
                          handleFilterChange('PaperId', paper.id);
                          setPaperFilterOpen(false);
                        }}
                      >
                        <span className="truncate">{paper.title}</span>
                        {localFilters.PaperId === paper.id && (
                          <Check className="size-4 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-muted-foreground px-2 py-1.5 text-sm">
                      No papers found
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <p className="text-muted-foreground text-xs font-medium">Status</p>
            <select
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              value={localFilters.Status}
              onChange={(e) => handleFilterChange('Status', e.target.value)}
            >
              <option value="">All Status</option>
              {TASK_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={String(s.value)}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <p className="text-muted-foreground text-xs font-medium">
              Date Field
            </p>
            <select
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              value={localFilters.DateField}
              onChange={(e) => handleFilterChange('DateField', e.target.value)}
            >
              <option value="">Select Date Field</option>
              {DATE_TASK_FILTER_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <p className="text-muted-foreground text-xs font-medium">
              From Date
            </p>
            <Input
              type="date"
              value={localFilters.FromDate}
              disabled={!isDateFieldSelected}
              onChange={(e) => handleFilterChange('FromDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <p className="text-muted-foreground text-xs font-medium">To Date</p>
            <Input
              type="date"
              value={localFilters.ToDate}
              disabled={!isDateFieldSelected}
              onChange={(e) => handleFilterChange('ToDate', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
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
            onClick={clearFilters}
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
      {tasksQuery.isLoading ? (
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
            const colTasks = items
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
                    className={cn('size-2 shrink-0 rounded-full', col.dot)}
                  />
                  <span
                    className={cn('flex-1 text-sm font-semibold', col.labelCls)}
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
                    if (dragOverCol !== col.status) setDragOverCol(col.status);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      setDragOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    if (!draggedTaskId) return;
                    const task = items.find((t) => t.id === draggedTaskId);
                    if (!task) return;
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
                      const canDelete =
                        !!currentUsername &&
                        (task.createdBy || '').trim().toLowerCase() ===
                          currentUsername;
                      const isPending = dndMutatingRef.current.has(task.id);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedTaskId(task.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverCol(null);
                          }}
                          onClick={() => openEdit(task)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openEdit(task);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'group bg-card relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
                            isPending &&
                              'ring-1 ring-blue-400 dark:ring-blue-500',
                          )}
                        >
                          {/* Pending indicator */}
                          {isPending && (
                            <span className="absolute top-2 right-2 inline-flex size-2 animate-pulse rounded-full bg-blue-400" />
                          )}

                          {/* Name + delete action */}
                          <div className="flex items-start gap-1.5">
                            <p className="flex-1 text-sm leading-snug font-medium">
                              {task.name}
                            </p>
                            {canDelete && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingTask(task);
                                }}
                                title="Delete task"
                                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 className="size-3.5 text-red-600" />
                              </Button>
                            )}
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-muted-foreground line-clamp-2 text-xs">
                              {task.description}
                            </p>
                          )}

                          {/* Paper name */}
                          {task.paperTitle && (
                            <p className="text-muted-foreground truncate text-[11px]">
                              📄 {task.paperTitle}
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
                                    Review: {formatDate(task.nextReviewDate)}
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

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Create New Task</SheetTitle>
            <SheetDescription>
              Fill in the details to create a new task. Fields marked with * are
              required.
            </SheetDescription>
          </SheetHeader>
          <form
            id="create-task-form"
            onSubmit={handleCreate}
            className="flex flex-col gap-4 px-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="create-paper-id"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Paper Name *
                </label>
                <select
                  id="create-paper-id"
                  className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  value={createForm.paperId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      paperId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select paper</option>
                  {assignedPapers.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-assignee"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Assigned To
                </label>
                <Input
                  id="create-assignee"
                  placeholder="Assigned to (You)"
                  value={createForm.assignedToUserName}
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-name"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Task Name *
                </label>
                <Input
                  id="create-name"
                  placeholder="Enter task name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-desc"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Description
                </label>
                <textarea
                  id="create-desc"
                  className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  placeholder="Enter task description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-status"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Status
                </label>
                <select
                  id="create-status"
                  className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {TASK_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={String(s.value)}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="create-start"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Start Date
                  </label>
                  <Input
                    id="create-start"
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
                <div className="space-y-2">
                  <label
                    htmlFor="create-review"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Next Review
                  </label>
                  <Input
                    id="create-review"
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
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-complete"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Complete Date
                </label>
                <Input
                  id="create-complete"
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
          </form>
          <SheetFooter className="gap-2">
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                className={`min-w-25 ${BTN.CANCEL}`}
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="submit"
              form="create-task-form"
              className={`min-w-25 ${BTN.CREATE}`}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
            <SheetDescription>
              Update task details and schedule.
            </SheetDescription>
          </SheetHeader>
          <form
            id="edit-task-form"
            onSubmit={handleUpdate}
            className="flex flex-col gap-4 px-4"
          >
            {(() => {
              const isOwnedTask =
                !!currentUsername &&
                !!editingTask &&
                (editingTask.createdBy || '').trim().toLowerCase() ===
                  currentUsername;
              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm leading-none font-medium">Paper</p>
                    <Input
                      value={
                        editingTask?.paperTitle || editingTask?.paperId || ''
                      }
                      readOnly
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm leading-none font-medium">
                      Task Name
                    </p>
                    <Input
                      value={editingTask?.name || ''}
                      readOnly
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  {editingTask?.description && (
                    <div className="space-y-2">
                      <p className="text-sm leading-none font-medium">
                        Description
                      </p>
                      <p className="text-muted-foreground bg-muted/50 rounded-md border px-3 py-2 text-sm">
                        {editingTask.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="edit-assignee"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Assigned To
                    </label>
                    <Input
                      id="edit-assignee"
                      placeholder="Assigned to"
                      value={updateForm.assignedToUserName}
                      readOnly
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  {isOwnedTask ? (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="edit-name"
                          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Task Name *
                        </label>
                        <Input
                          id="edit-name"
                          placeholder="Task name *"
                          value={updateForm.name}
                          onChange={(e) =>
                            setUpdateForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="edit-desc"
                          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Description
                        </label>
                        <textarea
                          id="edit-desc"
                          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                          placeholder="Description"
                          value={updateForm.description}
                          onChange={(e) =>
                            setUpdateForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="space-y-2">
                    <label
                      htmlFor="edit-status"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Status
                    </label>
                    <select
                      id="edit-status"
                      className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                      value={updateForm.status}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      {TASK_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={String(s.value)}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="edit-start"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Start Date
                      </label>
                      <Input
                        id="edit-start"
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
                    <div className="space-y-2">
                      <label
                        htmlFor="edit-review"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Next Review
                      </label>
                      <Input
                        id="edit-review"
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
                </div>
              );
            })()}
          </form>
          <SheetFooter className="gap-2">
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                className={`min-w-25 ${BTN.CANCEL}`}
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="submit"
              form="edit-task-form"
              className={`min-w-25 ${BTN.EDIT}`}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </SheetFooter>
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
              onClick={() => {
                if (!deletingTask) return;
                const canDeleteTask =
                  !!currentUsername &&
                  (deletingTask.createdBy || '').trim().toLowerCase() ===
                    currentUsername;
                if (!canDeleteTask) {
                  toast.error('You can only delete tasks created by you');
                  setDeletingTask(null);
                  return;
                }
                deleteTaskMutation.mutate(deletingTask.id);
              }}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
};

export default MyTasksRoute;
