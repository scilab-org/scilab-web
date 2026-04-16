import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useRef, useState } from 'react';
import { Calendar, BookOpen, Trash2, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';

import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { BTN } from '@/lib/button-styles';
import { paths } from '@/config/paths';
import { useUser, getUserGroups } from '@/lib/auth';
import {
  useDeleteTask,
  useMyTasks,
  useUpdateTask,
} from '@/features/task-management/api';
import {
  DATE_TASK_FILTER_OPTIONS,
  TASK_MANAGEMENT_QUERY_KEYS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_LABELS,
} from '@/features/task-management/constants';
import { cn } from '@/utils/cn';
import {
  DateTaskFilterField,
  GetMyTasksParams,
  TaskItem,
  UpdateTaskDto,
} from '@/features/task-management/types';

export const clientLoader = () => async () => null;

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
  const navigate = useNavigate();
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [updateForm, setUpdateForm] = useState<TaskFormState>(
    createInitialTaskForm,
  );
  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, number>
  >({});
  const dndMutatingRef = useRef<Set<string>>(new Set());
  const { data: user } = useUser();
  const currentUsername = (user?.preferredUsername || '').trim().toLowerCase();
  const isAuthor = getUserGroups().some((g) =>
    g.toLowerCase().includes('author'),
  );

  // Auto-fill assigned username when opening create dialog
  const [localFilters, setLocalFilters] = useState({
    Status: searchParams.get('Status') || '',
    PaperId: searchParams.get('PaperId') || '',
    DateField:
      (searchParams.get('DateField') as DateTaskFilterField | null) || '',
    FromDate: searchParams.get('FromDate') || '',
    ToDate: searchParams.get('ToDate') || '',
  });

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
  const items: TaskItem[] = useMemo(
    () => tasksQuery.data?.result?.items ?? [],
    [tasksQuery.data],
  );

  const isDateFieldSelected = Boolean(localFilters.DateField);
  const paperFilterOptions = useMemo(() => {
    const seen = new Set<string>();
    return items
      .filter(
        (t) =>
          t.paperId &&
          t.paperTitle &&
          !seen.has(t.paperId) &&
          seen.add(t.paperId),
      )
      .map((t) => ({ label: t.paperTitle!, value: t.paperId }));
  }, [items]);

  // Create task is handled from the paper detail page (author only)

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

  const openEdit = (task: TaskItem) => {
    setEditingTask(task);
    setUpdateForm({
      paperId: task.paperId,
      name: task.name,
      description: task.description || '',
      assignedToUserName: task.assignedToUserName || '',
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
        : editingTask.assignedToUserName || '',
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
          assignedToUserName: task.assignedToUserName ?? '',
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
    <>
      <Head title="My Tasks" />
      <ContentLayout
        title="My Task"
        description="Track, filter and manage your paper tasks"
      >
        <form
          onSubmit={applyFilters}
          className="mb-6 flex flex-wrap items-end gap-2 rounded-md border bg-[#E9E1D8] p-2"
        >
          <div className="bg-background h-10 min-w-55 flex-1 rounded-md">
            <FilterDropdown
              value={localFilters.PaperId}
              onChange={(value) => handleFilterChange('PaperId', value)}
              options={paperFilterOptions}
              placeholder="All Papers"
              variant="outline"
              className="h-10 w-full justify-between px-4 font-sans"
            />
          </div>
          <div className="bg-background h-10 w-48 rounded-md">
            <FilterDropdown
              value={localFilters.Status}
              onChange={(value) => handleFilterChange('Status', value)}
              options={TASK_STATUS_OPTIONS.map((s) => ({
                label: s.label,
                value: String(s.value),
              }))}
              placeholder="All status"
              variant="outline"
              className="h-10 w-full justify-between px-4 font-sans"
            />
          </div>
          <div className="bg-background h-10 w-52 rounded-md">
            <FilterDropdown
              value={localFilters.DateField}
              onChange={(value) => handleFilterChange('DateField', value)}
              options={DATE_TASK_FILTER_OPTIONS.map((f) => ({
                label: f.label,
                value: f.value,
              }))}
              placeholder="Select Date Field"
              variant="outline"
              className="h-10 w-full justify-between px-4 font-sans"
            />
          </div>
          <Input
            type="date"
            value={localFilters.FromDate}
            disabled={!isDateFieldSelected}
            onChange={(e) => handleFilterChange('FromDate', e.target.value)}
            className="bg-background h-10 w-42.5"
          />
          <Input
            type="date"
            value={localFilters.ToDate}
            disabled={!isDateFieldSelected}
            onChange={(e) => handleFilterChange('ToDate', e.target.value)}
            className="bg-background h-10 w-42.5"
          />

          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground h-10 px-3"
            >
              <X className="size-4" />
              Clear ({activeFilterCount})
            </Button>
          )}

          <Button
            type="submit"
            variant="outline"
            className="border-input h-10 px-6 font-sans text-sm font-medium"
          >
            Search
          </Button>
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
                      isDragTarget && 'ring-primary/40 ring-2 ring-inset',
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverCol !== col.status)
                        setDragOverCol(col.status);
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
                            onClick={() => {
                              if (isAuthor) openEdit(task);
                              else setViewingTask(task);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (isAuthor) openEdit(task);
                                else setViewingTask(task);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              'group bg-card relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
                              isPending && 'ring-primary/40 ring-1',
                            )}
                          >
                            {/* Pending indicator */}
                            {isPending && (
                              <span className="bg-primary absolute top-2 right-2 inline-flex size-2 animate-pulse rounded-full" />
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

                            {/* Task type */}
                            {task.taskType && (
                              <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                                {TASK_TYPE_LABELS[task.taskType] ?? 'Task'}
                              </span>
                            )}

                            {/* Description */}
                            {task.description && (
                              <p className="text-muted-foreground line-clamp-2 text-xs">
                                {task.description}
                              </p>
                            )}

                            {/* Paper name */}
                            {task.paperTitle && (
                              <p className="text-muted-foreground truncate text-[11px]">
                                {task.paperTitle}
                              </p>
                            )}

                            {/* Section (writing tasks) */}
                            {task.sectionTitle && (
                              <div className="flex items-center gap-1">
                                <p className="text-muted-foreground flex-1 truncate text-[11px]">
                                  {task.sectionTitle}
                                </p>
                                {task.sectionId &&
                                  task.subProjectId &&
                                  task.subProjectId !==
                                    '00000000-0000-0000-0000-000000000000' && (
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      title="Open Editor"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          paths.app.assignedProjects.paperDetail.getHref(
                                            task.subProjectId!,
                                            task.paperId,
                                          ),
                                          {
                                            state: {
                                              initialTab: 'sections',
                                              initialSectionId: task.sectionId,
                                            },
                                          },
                                        );
                                      }}
                                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                      <BookOpen className="size-3.5 text-blue-600" />
                                    </Button>
                                  )}
                              </div>
                            )}

                            {/* Assignee */}
                            <div className="flex items-center gap-1.5">
                              <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
                                {task.assignedToUserName?.charAt(0) ?? '?'}
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

        {/* ── View Task Info Dialog (non-authors, read-only) ───────── */}
        <Dialog
          open={!!viewingTask}
          onOpenChange={(open) => !open && setViewingTask(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{viewingTask?.name}</DialogTitle>
              <DialogDescription>
                <span className="font-mono text-[10px] tracking-wider uppercase">
                  {TASK_TYPE_LABELS[viewingTask?.taskType ?? 0] ?? 'Task'}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {viewingTask?.description && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-mono text-[10px] font-semibold tracking-widest uppercase">
                    Description
                  </p>
                  <p className="bg-muted/50 rounded-md border px-3 py-2 text-sm leading-relaxed">
                    {viewingTask.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-mono text-[10px] font-semibold tracking-widest uppercase">
                    Assigned To
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
                      {viewingTask?.assignedToUserName?.charAt(0) ?? '?'}
                    </div>
                    <span className="text-sm">
                      {viewingTask?.assignedToUserName ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-mono text-[10px] font-semibold tracking-widest uppercase">
                    Status
                  </p>
                  <span className="text-sm">
                    {TASK_STATUS_OPTIONS.find(
                      (s) => s.value === viewingTask?.status,
                    )?.label ?? '—'}
                  </span>
                </div>
              </div>

              {viewingTask?.sectionTitle && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-mono text-[10px] font-semibold tracking-widest uppercase">
                    Section
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm">{viewingTask.sectionTitle}</p>
                    {viewingTask.sectionId &&
                      viewingTask.subProjectId &&
                      viewingTask.subProjectId !==
                        '00000000-0000-0000-0000-000000000000' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingTask(null);
                            navigate(
                              paths.app.assignedProjects.paperDetail.getHref(
                                viewingTask.subProjectId!,
                                viewingTask.paperId,
                              ),
                              {
                                state: {
                                  initialTab: 'sections',
                                  initialSectionId: viewingTask.sectionId,
                                  parentProjectId: viewingTask.projectId,
                                },
                              },
                            );
                          }}
                        >
                          <BookOpen className="size-3.5" />
                          Open Editor
                        </Button>
                      )}
                  </div>
                </div>
              )}

              {viewingTask?.paperTitle && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-mono text-[10px] font-semibold tracking-widest uppercase">
                    Paper
                  </p>
                  <p className="text-sm">{viewingTask.paperTitle}</p>
                </div>
              )}

              {(viewingTask?.startDate ||
                viewingTask?.nextReviewDate ||
                viewingTask?.completeDate) && (
                <div className="space-y-2 border-t pt-3">
                  {viewingTask.startDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{formatDate(viewingTask.startDate)}</span>
                    </div>
                  )}
                  {viewingTask.nextReviewDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Review</span>
                      <span>{formatDate(viewingTask.nextReviewDate)}</span>
                    </div>
                  )}
                  {viewingTask.completeDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>{formatDate(viewingTask.completeDate)}</span>
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
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        >
          <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details and schedule.
              </DialogDescription>
            </DialogHeader>
            <form
              id="edit-task-form"
              onSubmit={handleUpdate}
              className="scrollbar-dialog flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
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
            <DialogFooter className="gap-2 px-4 pb-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`min-w-25 ${BTN.CANCEL}`}
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="edit-task-form"
                className={`min-w-25 ${BTN.EDIT}`}
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
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
                <span className="font-semibold">{deletingTask?.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={BTN.CANCEL}>
                Cancel
              </AlertDialogCancel>
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
    </>
  );
};

export default MyTasksRoute;
