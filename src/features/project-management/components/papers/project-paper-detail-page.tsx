import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  User,
  X,
  Trash2,
  FileText,
  Target,
  BookOpen,
  Globe,
  PenTool,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BTN } from '@/lib/button-styles';
import { cn } from '@/utils/cn';
import { useUser } from '@/lib/auth';
import { useWritingPaperDetail } from '@/features/paper-management/api/get-writing-paper';
import { PaperSectionsManager } from '@/features/paper-management/components/paper-sections-manager';
import { PaperOldSectionsManager } from '@/features/paper-management/components/paper-old-sections-manager';
import { MarkMainSectionDialog } from '@/features/paper-management/components/mark-main-section-dialog';
import { PAPER_STATUS_MAP, PAPER_MANAGEMENT_QUERY_KEYS } from '@/features/paper-management/constants';
import { usePaperMembers } from '@/features/project-management/api/papers/get-paper-members';
import { ProjectMember } from '@/features/project-management/types';
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

const statusBadgeClass = (status: number) => {
  if (status === 4)
    return 'border-gray-300 bg-gray-200 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300';
  if (status === 3)
    return 'border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (status === 2)
    return 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  return 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

const getStatusLabel = (status: number) => {
  if (status === 4) return 'Closed';
  return (
    TASK_STATUS_OPTIONS.find((s) => s.value === status)?.label ??
    `Status ${status}`
  );
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
}: {
  projectId: string;
  paperId: string;
  isAuthor?: boolean;
  isManager?: boolean;
  backPath: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const paperQuery = useWritingPaperDetail({ paperId });
  const [activeTab, setActiveTab] = useState<
    'sections' | 'old-sections' | 'tasks'
  >('sections');
  const [isMarkMainSectionDialogOpen, setIsMarkMainSectionDialogOpen] =
    useState(false);
  const [isPaperInfoExpanded, setIsPaperInfoExpanded] = useState(false);
  const [taskPage, setTaskPage] = useState(1);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
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
  const subProjectId = paper?.subProjectId || projectId;

  const paperTasksQuery = usePaperTasks({
    paperId,
    params: {
      PageNumber: taskPage,
      PageSize: 10,
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
    queryConfig: { enabled: activeTab === 'tasks' && !!paperId },
  });

  const paperMembersQuery = usePaperMembers({
    subProjectId,
    params: { pageNumber: 1, pageSize: 1000 },
    queryConfig: { enabled: activeTab === 'tasks' && !!subProjectId },
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
      onSuccess: () => {
        toast.success('Task updated successfully');
        setEditingTask(null);
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
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
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
    setTaskPage(1);
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
    setTaskPage(1);
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
        description: isAuthor ? updateForm.description : (editingTask.description || ''),
        assignedToUserName: isAuthor ? updateForm.assignedToUserName : editingTask.assignedToUserName,
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
    <ContentLayout title={paper.title || 'Untitled Paper'}>
      <div className="space-y-6">
        {/* Paper Info Card */}
        <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
          <button
            type="button"
            onClick={() => setIsPaperInfoExpanded((prev) => !prev)}
            className="hover:bg-muted/40 flex w-full items-center justify-between border-b px-6 py-4 text-left transition-colors"
          >
            <div>
              <p className="text-foreground text-base font-semibold">
                Paper Information
              </p>
              <p className="text-muted-foreground text-xs">
                Click to {isPaperInfoExpanded ? 'collapse' : 'expand'} details
              </p>
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
              {isPaperInfoExpanded ? 'Hide details' : 'Show details'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isPaperInfoExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </button>
          <div className="p-6">
            {/* Header: Title, Status, Type */}
            <div className="mb-4 flex items-start gap-4">
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  {paper.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {paperType && <Badge variant="outline">{paperType}</Badge>}
                  <Badge
                    className={
                      paper.status === 1
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                        : paper.status === 2
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          : paper.status === 3
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                    }
                  >
                    {PAPER_STATUS_MAP[paper.status] || 'Unknown'}
                  </Badge>
                  {paper.template && (
                    <Badge variant="secondary">{paper.template}</Badge>
                  )}
                </div>
              </div>
              <div className="text-muted-foreground space-y-1 text-right text-sm">
                {paper.createdBy && (
                  <div className="flex items-center justify-end gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>Created by {paper.createdBy}</span>
                  </div>
                )}
              </div>
            </div>

            {isPaperInfoExpanded && (
              <div className="mt-8 space-y-6 border-t pt-8">
                {/* Abstract - Full Width */}
                <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <FileText className="size-5" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Abstract
                    </h3>
                  </div>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {paper.abstract || 'No abstract provided for this paper.'}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <BookOpen className="size-5" />
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Main Contribution
                      </h3>
                    </div>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {paper.mainContribution || 'No main contribution listed.'}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100/50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Globe className="size-5" />
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Context
                      </h3>
                    </div>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {paper.context || 'No context defined.'}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100/50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                        <Target className="size-5" />
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Research Gap
                      </h3>
                    </div>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {paper.researchGap || 'No research gap explicitly stated.'}
                    </p>
                    {paper.gapType && (
                      <p className="mt-4 inline-block rounded-md bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
                        Type: {paper.gapType}
                      </p>
                    )}
                  </div>

                  {(paper.journalName || paper.journal) && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100/50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                          <BookOpen className="size-5" />
                        </div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Journal
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {paper.journalName && (
                          <p className="text-[15px] font-medium text-foreground">
                            {paper.journalName}
                          </p>
                        )}
                        {paper.journal && paper.journal !== paper.journalName && (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/80">
                            {paper.journal}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(paper.styleName || paper.styleDescription) && (
                    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100/50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                          <PenTool className="size-5" />
                        </div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Style Guidelines
                        </h3>
                      </div>
                      <div className="space-y-2 text-[15px] leading-relaxed">
                        {paper.styleName && (
                          <p className="font-medium text-foreground">
                            {paper.styleName}
                          </p>
                        )}
                        {paper.styleDescription && (
                          <p className="text-foreground/80">
                            {paper.styleDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
          <div className="border-border mb-4 flex items-center gap-2 border-b pb-3">
            <Button
              type="button"
              variant={activeTab === 'sections' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('sections');
                queryClient.invalidateQueries({
                  queryKey: [
                    PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS,
                    paperId,
                  ],
                });
              }}
              className={cn(
                'h-9 px-4 text-sm font-medium',
                activeTab === 'sections' ? 'bg-blue-600 hover:bg-blue-700' : '',
              )}
            >
              Sections
            </Button>
            <Button
              type="button"
              variant={activeTab === 'tasks' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('tasks');
                queryClient.invalidateQueries({
                  queryKey: [TASK_MANAGEMENT_QUERY_KEYS.PAPER_TASKS, paperId],
                });
              }}
              className={cn(
                'h-9 px-4 text-sm font-medium',
                activeTab === 'tasks' ? 'bg-blue-600 hover:bg-blue-700' : '',
              )}
            >
              Tasks
            </Button>
            <Button
              type="button"
              variant={activeTab === 'old-sections' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('old-sections');
                queryClient.invalidateQueries({
                  queryKey: [
                    PAPER_MANAGEMENT_QUERY_KEYS.ASSIGNED_SECTIONS_HISTORY,
                    paperId,
                  ],
                });
              }}
              className={cn(
                'h-9 px-4 text-sm font-medium',
                activeTab === 'old-sections'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : '',
              )}
            >
              Old Section
            </Button>
            {isAuthor && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMarkMainSectionDialogOpen(true)}
                className={`ml-auto ${BTN.WARNING}`}
              >
                Mark Main Section
              </Button>
            )}
          </div>

          <MarkMainSectionDialog
            isOpen={isMarkMainSectionDialogOpen}
            onOpenChange={setIsMarkMainSectionDialogOpen}
            paperId={paperId}
            subProjectId={subProjectId}
          />

          {activeTab === 'sections' ? (
            <PaperSectionsManager
              paperId={paperId}
              paperTitle={paper.title || 'Untitled'}
              projectId={projectId}
              subProjectId={subProjectId}
              isAuthor={isAuthor}
              isManager={isManager}
            />
          ) : activeTab === 'old-sections' ? (
            <PaperOldSectionsManager
              paperId={paperId}
              paperTitle={paper.title || 'Untitled'}
            />
          ) : (
            <div>
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

              <div className="mb-4 flex items-center justify-end">
                {isAuthor && (
                  <Button
                    className={BTN.CREATE}
                    onClick={() => setIsCreateTaskOpen(true)}
                  >
                    <Plus className="size-4" />
                    Create Task
                  </Button>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border">
                {paperTasksQuery.isLoading ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (paperTasksQuery.data?.result?.items?.length ?? 0) > 0 ? (
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
                        {(paperTasksQuery.data?.result?.items ?? []).map(
                          (task) => (
                            <TableRow
                              key={task.id}
                              className="transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20"
                            >
                              <TableCell className="max-w-[320px]">
                                <p className="font-medium">{task.name}</p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {task.description || 'No description'}
                                </p>
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
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(task.startDate)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(task.nextReviewDate)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(task.completeDate)}
                              </TableCell>
                              <TableCell className="text-right">
                                {isAuthor ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      onClick={() => openUpdateTask(task)}
                                      title="Update task details"
                                    >
                                      <Pencil className="size-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteTask(task.id)}
                                      title="Delete task"
                                      disabled={deleteTaskMutation.isPending}
                                    >
                                      <Trash2 className="size-4 text-red-600" />
                                    </Button>
                                  </div>
                                ) : currentUsername &&
                                  task.assignedToUserName.toLowerCase() ===
                                    currentUsername ? (
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => openUpdateTask(task)}
                                    title="Update status and dates"
                                  >
                                    <Pencil className="size-4 text-blue-600" />
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>

                    {paperTasksQuery.data?.result?.paging && (
                      <div className="grid grid-cols-3 items-center border-t px-4 py-4">
                        <p className="text-muted-foreground text-sm">
                          Page{' '}
                          <span className="text-foreground font-medium">
                            {paperTasksQuery.data.result.paging.pageNumber}
                          </span>{' '}
                          of{' '}
                          <span className="text-foreground font-medium">
                            {paperTasksQuery.data.result.paging.totalPages}
                          </span>{' '}
                          &middot;{' '}
                          {paperTasksQuery.data.result.paging.totalCount}{' '}
                          results
                        </p>

                        <div className="col-start-3 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={
                              !paperTasksQuery.data.result.paging
                                .hasPreviousPage
                            }
                            onClick={() =>
                              setTaskPage((prev) => Math.max(prev - 1, 1))
                            }
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={
                              !paperTasksQuery.data.result.paging.hasNextPage
                            }
                            onClick={() => setTaskPage((prev) => prev + 1)}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    No tasks found for this paper.
                  </div>
                )}
              </div>
            </div>
          )}
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
                  className="border-input bg-background focus-visible:ring-ring min-h-[90px] w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
                {isAuthor ? 'Update task details' : 'Only status and your date fields can be updated'}
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4 pr-1">
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
                        setUpdateForm((prev) => ({ ...prev, name: e.target.value }))
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
                      className="border-input bg-background focus-visible:ring-ring min-h-[90px] w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
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
                  {(isAuthor ? AUTHOR_TASK_STATUS_OPTIONS : TASK_STATUS_OPTIONS).map((status) => (
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
              <SheetClose asChild>
                <Button type="button" variant="outline" className={BTN.CANCEL}>
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                className={BTN.EDIT}
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </ContentLayout>
  );
};
