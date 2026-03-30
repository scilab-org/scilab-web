import { QueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardList,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/layouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  TASK_STATUS_OPTIONS,
} from '@/features/task-management/constants';
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

const statusBadgeClass = (status: number) => {
  if (status === 4)
    return 'border-gray-300 bg-gray-200 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300';
  if (status === 3)
    return 'border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (status === 2)
    return 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  if (status === 1)
    return 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

const getStatusLabel = (status: number) => {
  if (status === 4) return 'Closed';
  return (
    TASK_STATUS_OPTIONS.find((s) => s.value === status)?.label ??
    `Status ${status}`
  );
};

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
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 10);
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
  const assignedPapers = assignedPapersQuery.data?.result?.items ?? [];
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
    PageNumber: page,
    PageSize: pageSize,
    AssignedToUserName: undefined, // Removed from filter as requested
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
  const paging = tasksQuery.data?.result?.paging;

  const stats = useMemo(() => {
    const total = items.length;
    const todo = items.filter((t) => t.status === 1).length;
    const inProgress = items.filter((t) => t.status === 2).length;
    const completed = items.filter((t) => t.status === 3).length;
    return { total, todo, inProgress, completed };
  }, [items]);

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
      onSuccess: () => {
        toast.success('Task updated successfully');
        setEditingTask(null);
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
      // Ensure page is reset to 1 when filtering
      next.set('page', '1');
      next.set('pageSize', String(pageSize));
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
    setSearchParams({ page: '1', pageSize: String(pageSize) });
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
            <label className="text-muted-foreground text-xs font-medium">
              Paper Name
            </label>
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
                className="w-[var(--radix-popover-trigger-width)] p-2"
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
            <label className="text-muted-foreground text-xs font-medium">
              Status
            </label>
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
            <label className="text-muted-foreground text-xs font-medium">
              Date Field
            </label>
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
            <label className="text-muted-foreground text-xs font-medium">
              From Date
            </label>
            <Input
              type="date"
              value={localFilters.FromDate}
              disabled={!isDateFieldSelected}
              onChange={(e) => handleFilterChange('FromDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-muted-foreground text-xs font-medium">
              To Date
            </label>
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Total</CardDescription>
            <CardTitle>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>To Do</CardDescription>
            <CardTitle>{stats.todo}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>In Progress</CardDescription>
            <CardTitle>{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardDescription>Completed</CardDescription>
            <CardTitle>{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border">
        {tasksQuery.isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-linear-to-r from-green-50 to-emerald-50 hover:from-green-50 hover:to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Assignee
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Paper Name
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Start
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Next Review
                  </TableHead>
                  <TableHead className="font-semibold text-green-900 dark:text-green-200">
                    Complete
                  </TableHead>
                  <TableHead className="text-right font-semibold text-green-900 dark:text-green-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((task) =>
                  (() => {
                    const canDeleteTask =
                      !!currentUsername &&
                      (task.createdBy || '').trim().toLowerCase() ===
                        currentUsername;
                    return (
                      <TableRow
                        key={task.id}
                        className="transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20"
                      >
                        <TableCell className="max-w-[260px]">
                          <div className="font-medium">{task.name}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {task.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>{task.assignedToUserName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(task.status)}
                          >
                            {getStatusLabel(task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[260px] truncate text-sm">
                          {task.paperTitle || task.paperId}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {task.startDate ? formatDate(task.startDate) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {task.nextReviewDate
                            ? formatDate(task.nextReviewDate)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {task.completeDate
                            ? formatDate(task.completeDate)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => openEdit(task)}
                              title="Edit task"
                            >
                              <Pencil className="size-4 text-blue-600" />
                            </Button>
                            {canDeleteTask && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setDeletingTask(task)}
                                title="Delete task"
                              >
                                <Trash2 className="size-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })(),
                )}
              </TableBody>
            </Table>

            {paging && (
              <div className="mt-6 grid grid-cols-3 items-center border-t px-4 pt-4 pb-4">
                <p className="text-muted-foreground text-sm">
                  Page{' '}
                  <span className="text-foreground font-medium">
                    {paging.pageNumber}
                  </span>{' '}
                  of{' '}
                  <span className="text-foreground font-medium">
                    {paging.totalPages}
                  </span>{' '}
                  &middot; {paging.totalCount} results
                </p>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!paging.hasPreviousPage}
                    onClick={() =>
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('page', String(page - 1));
                        next.set('pageSize', String(pageSize));
                        return next;
                      })
                    }
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {Array.from({ length: paging.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (paging.totalPages <= 7) return true;
                      if (p === 1 || p === paging.totalPages) return true;
                      if (Math.abs(p - paging.pageNumber) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="text-muted-foreground px-0.5 text-sm"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={
                            item === paging.pageNumber ? 'default' : 'outline'
                          }
                          size="icon"
                          className={`size-8 text-xs ${item === paging.pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                          onClick={() =>
                            setSearchParams((prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(item));
                              next.set('pageSize', String(pageSize));
                              return next;
                            })
                          }
                        >
                          {item}
                        </Button>
                      ),
                    )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!paging.hasNextPage}
                    onClick={() =>
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('page', String(page + 1));
                        next.set('pageSize', String(pageSize));
                        return next;
                      })
                    }
                  >
                    <ChevronRight className="size-4" />
                  </Button>

                  <div className="ml-3 flex items-center gap-1.5 border-l pl-3">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      Go to
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={paging.totalPages}
                      defaultValue={paging.pageNumber}
                      className="h-8 w-14 text-center text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = Number(
                            (e.target as HTMLInputElement).value,
                          );
                          if (val >= 1 && val <= paging.totalPages) {
                            setSearchParams((prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('page', String(val));
                              next.set('pageSize', String(pageSize));
                              return next;
                            });
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div />
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <ClipboardList className="text-muted-foreground/40 mx-auto mb-3 size-10" />
            <p className="font-medium">No tasks found</p>
            <p className="text-muted-foreground text-sm">
              Try changing filters or create a new task.
            </p>
          </div>
        )}
      </div>

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
