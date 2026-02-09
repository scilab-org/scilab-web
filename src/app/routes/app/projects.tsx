import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { paths } from '@/config/paths';
import { api } from '@/lib/api-client';
import { Project, ProjectsResponse } from '@/types/api';

type CreateProjectData = {
  name: string;
  code: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
};

const getProjects = async (params?: {
  searchText?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<ProjectsResponse> => {
  return await api.get('/admin/projects', {
    params: {
      SearchText: params?.searchText || '',
      PageNumber: params?.pageNumber || 1,
      PageSize: params?.pageSize || 10,
    },
  });
};

const createProject = async (data: CreateProjectData): Promise<void> => {
  await api.post('/admin/projects', data);
};

type ProjectCardProps = {
  project: Project;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return {
          text: 'Draft',
          class:
            'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        };
      case 2:
        return {
          text: 'Active',
          class:
            'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        };
      case 3:
        return {
          text: 'Completed',
          class:
            'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        };
      case 4:
        return {
          text: 'Archived',
          class:
            'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        };
      default:
        return {
          text: 'Unknown',
          class:
            'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const today = new Date();
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysElapsed = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);

  return (
    <div className="bg-card border-border group overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md">
      <div className="border-border bg-muted/30 border-b px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-foreground text-lg font-semibold tracking-tight">
                {project.name}
              </h3>
              <span
                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${statusConfig.class}`}
              >
                {statusConfig.text}
              </span>
            </div>
            <p className="text-muted-foreground font-mono text-sm">
              {project.code}
            </p>
          </div>
          <Button
            onClick={() =>
              navigate(paths.app.projectDetail.getHref(project.id))
            }
            size="sm"
            className="shrink-0"
          >
            View Details
          </Button>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-4">
          <div>
            <p className="text-foreground line-clamp-2 text-sm leading-relaxed">
              {project.description || 'No description provided'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Start Date
              </p>
              <p className="text-foreground text-sm font-medium">
                {formatDate(project.startDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                End Date
              </p>
              <p className="text-foreground text-sm font-medium">
                {formatDate(project.endDate)}
              </p>
            </div>
          </div>

          {project.status === 2 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Timeline Progress
                </p>
                <p className="text-muted-foreground text-xs font-medium">
                  {Math.round(progress)}%
                </p>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="border-border flex items-center justify-between border-t pt-3">
            <div className="text-muted-foreground text-xs">
              Created by{' '}
              <span className="text-foreground font-medium">
                {project.createdBy || 'System'}
              </span>
            </div>
            <div className="text-muted-foreground text-xs">
              {formatDate(project.createdOnUtc)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateProjectSheet = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    code: '',
    description: '',
    status: 1,
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!', {
        description: `${formData.name} has been added to the system.`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create project', {
        description: error?.message || 'Please try again later.',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 1,
      startDate: '',
      endDate: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate dates if both are provided
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert datetime-local format to ISO 8601 format with proper DateTimeOffset
      const payload = {
        ...formData,
        status: Number(formData.status), // Ensure status is number
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : new Date().toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : new Date(
              new Date().setMonth(new Date().getMonth() + 1),
            ).toISOString(),
      };
      createMutation.mutate(payload);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Create Project</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-150">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Create New Project</SheetTitle>
            <SheetDescription>
              Fill in the details to create a new project. Fields marked with *
              are required.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="project-name"
                  className="text-foreground text-sm font-medium"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="project-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., AI Recommendation System"
                />
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="project-code"
                  className="text-foreground text-sm font-medium"
                >
                  Code <span className="text-destructive">*</span>
                </label>
                <Input
                  id="project-code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., AI-REC-001"
                />
                {errors.code && (
                  <p className="text-destructive text-sm">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-description"
                className="text-foreground text-sm font-medium"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="project-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter project description"
                rows={3}
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-status"
                className="text-foreground text-sm font-medium"
              >
                Status <span className="text-destructive">*</span>
              </label>
              <select
                id="project-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                <option value="1">Draft</option>
                <option value="2">Active</option>
                <option value="3">Completed</option>
                <option value="4">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-startDate"
                className="text-foreground text-sm font-medium"
              >
                Start Date
              </label>
              <Input
                id="project-startDate"
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="project-endDate"
                className="text-foreground text-sm font-medium"
              >
                End Date
              </label>
              <Input
                id="project-endDate"
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
              {errors.endDate && (
                <p className="text-destructive text-sm">{errors.endDate}</p>
              )}
            </div>
          </div>

          <SheetFooter className="gap-2">
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="min-w-25"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

const ProjectsRoute = () => {
  const [searchText, setSearchText] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', searchText, pageNumber, pageSize],
    queryFn: () => getProjects({ searchText, pageNumber, pageSize }),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setPageNumber(1); // Reset to page 1 when search changes
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPageNumber(1); // Reset to page 1 when page size changes
  };

  return (
    <ContentLayout
      title="Research Projects"
      description="Manage and track your scientific research projects"
    >
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <Input
              placeholder="Search projects by name or code..."
              value={searchText}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size"
                className="text-muted-foreground text-sm font-medium whitespace-nowrap"
              >
                Show:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <CreateProjectSheet />
        </div>
      </div>

      {isLoading && (
        <div className="text-muted-foreground py-8 text-center">Loading...</div>
      )}

      {error && (
        <div className="text-destructive py-8 text-center">
          An error occurred while loading data
        </div>
      )}

      {data && (
        <>
          <div className="bg-muted/50 border-border mb-6 flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="text-muted-foreground text-sm">
              Showing{' '}
              <span className="text-foreground font-medium">
                {data.result.items.length}
              </span>{' '}
              of{' '}
              <span className="text-foreground font-medium">
                {data.result.paging.totalCount}
              </span>{' '}
              projects
            </div>
            {data.result.paging.totalPages > 1 && (
              <div className="text-muted-foreground text-sm">
                Page {data.result.paging.pageNumber} of{' '}
                {data.result.paging.totalPages}
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {data.result.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination Controls */}
          {data.result.paging.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber((prev) => prev - 1)}
                disabled={!data.result.paging.hasPreviousPage}
              >
                Previous
              </Button>
              <div className="bg-muted text-muted-foreground flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium">
                {data.result.paging.pageNumber} /{' '}
                {data.result.paging.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber((prev) => prev + 1)}
                disabled={!data.result.paging.hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {data && data.result.items.length === 0 && (
        <div className="bg-muted/30 border-border rounded-lg border py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {searchText
              ? 'No projects match your search criteria'
              : 'No research projects yet'}
          </p>
          {!searchText && (
            <p className="text-muted-foreground mt-2 text-xs">
              Get started by creating your first research project
            </p>
          )}
        </div>
      )}
    </ContentLayout>
  );
};

export default ProjectsRoute;
