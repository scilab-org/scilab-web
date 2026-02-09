import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Download, Pencil, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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
} from '@/components/ui/sheet';
import { api } from '@/lib/api-client';
import { Dataset, DatasetsResponse, Project } from '@/types/api';
import { paths } from '@/config/paths';

type UpdateProjectData = {
  name: string;
  code: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
};

const getProjectById = async (projectId: string): Promise<Project> => {
  const response: any = await api.get(`/projects/${projectId}`);
  return response.result.project;
};

const updateProject = async (
  projectId: string,
  data: UpdateProjectData,
): Promise<void> => {
  await api.put(`/admin/projects/${projectId}`, data);
};

const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/admin/projects/${projectId}`);
};

const getDatasetsByProject = async (
  projectId: string,
  pageNumber: number = 1,
  pageSize: number = 5,
): Promise<DatasetsResponse> => {
  return await api.get(
    `/datasets?projectId=${projectId}&PageNumber=${pageNumber}&PageSize=${pageSize}`,
  );
};

type CreateDatasetData = {
  projectId: string;
  name: string;
  description: string;
  file: File;
};

type UpdateDatasetData = {
  datasetId: string;
  name: string;
  description: string;
  file?: File;
};

const createDataset = async (data: CreateDatasetData): Promise<void> => {
  const formData = new FormData();
  formData.append('projectId', data.projectId);
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('file', data.file);

  await api.post('/mananger/datasets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const updateDataset = async (data: UpdateDatasetData): Promise<void> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('description', data.description);
  if (data.file) {
    formData.append('file', data.file);
  }

  await api.put(`/mananger/datasets/${data.datasetId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const deleteDataset = async (datasetId: string): Promise<void> => {
  await api.delete(`/mananger/datasets/${datasetId}`);
};

type DatasetCardProps = {
  dataset: Dataset;
  onUpdate: (dataset: Dataset) => void;
  onDelete: (datasetId: string) => void;
};

const DatasetCard = ({ dataset, onUpdate, onDelete }: DatasetCardProps) => {
  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 0:
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 0:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const handleDownload = () => {
    if (dataset.filePath.startsWith('http')) {
      window.open(dataset.filePath, '_blank');
    } else {
      window.open(`${window.location.origin}${dataset.filePath}`, '_blank');
    }
  };

  const fileName = dataset.filePath.split('/').pop() || 'Unknown';
  const fileExtension = fileName.split('.').pop()?.toUpperCase() || '';

  return (
    <div className="bg-card border-border group overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md">
      <div className="from-muted/40 to-muted/20 bg-linear-to-r px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-foreground text-base font-semibold tracking-tight">
                {dataset.name}
              </h4>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusColor(dataset.status)}`}
              >
                {getStatusText(dataset.status)}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {dataset.description}
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold">
              {fileExtension}
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                File Name
              </p>
              <p className="text-foreground mt-0.5 font-mono text-sm">
                {fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate(dataset)}
              className="flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(dataset.id)}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectDetailRoute = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [datasetPage, setDatasetPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [datasetPageSize, setDatasetPageSize] = useState(5);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [addDatasetOpen, setAddDatasetOpen] = useState(false);
  const [updateDatasetOpen, setUpdateDatasetOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [formData, setFormData] = useState<UpdateProjectData>({
    name: '',
    code: '',
    description: '',
    status: 1,
    startDate: '',
    endDate: '',
  });
  const [datasetFormData, setDatasetFormData] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });
  const [updateDatasetFormData, setUpdateDatasetFormData] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datasetErrors, setDatasetErrors] = useState<Record<string, string>>(
    {},
  );
  const [updateDatasetErrors, setUpdateDatasetErrors] = useState<
    Record<string, string>
  >({});

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId!),
    enabled: !!projectId,
  });

  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ['datasets', projectId, datasetPage, datasetPageSize],
    queryFn: () =>
      getDatasetsByProject(projectId!, datasetPage, datasetPageSize),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectData) => updateProject(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully!');
      setUpdateOpen(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update project', {
        description: error?.message || 'Please try again later.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
      navigate(paths.app.projects.getHref());
    },
    onError: (error: any) => {
      toast.error('Failed to delete project', {
        description: error?.message || 'Please try again later.',
      });
    },
  });

  const createDatasetMutation = useMutation({
    mutationFn: createDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets', projectId] });
      toast.success('Dataset added successfully!');
      setAddDatasetOpen(false);
      resetDatasetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to add dataset', {
        description: error?.message || 'Please try again later.',
      });
    },
  });

  const updateDatasetMutation = useMutation({
    mutationFn: updateDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets', projectId] });
      toast.success('Dataset updated successfully!');
      setUpdateDatasetOpen(false);
      resetUpdateDatasetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to update dataset', {
        description: error?.message || 'Please try again later.',
      });
    },
  });

  const deleteDatasetMutation = useMutation({
    mutationFn: deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets', projectId] });
      toast.success('Dataset deleted successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete dataset', {
        description: error?.message || 'Please try again later.',
      });
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this project? This action cannot be undone.',
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleUpdate = () => {
    if (project) {
      // Convert dates from ISO to datetime-local format
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);

      setFormData({
        name: project.name,
        code: project.code,
        description: project.description,
        status: project.status,
        startDate: startDate.toISOString().slice(0, 16),
        endDate: endDate.toISOString().slice(0, 16),
      });
      setUpdateOpen(true);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';

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
      const payload = {
        ...formData,
        status: Number(formData.status),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      updateMutation.mutate(payload);
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDatasetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setDatasetFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (datasetErrors[name]) {
      setDatasetErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDatasetFormData((prev) => ({
      ...prev,
      file,
    }));
    if (datasetErrors.file) {
      setDatasetErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const resetDatasetForm = () => {
    setDatasetFormData({
      name: '',
      description: '',
      file: null,
    });
    setDatasetErrors({});
  };

  const validateDatasetForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!datasetFormData.name.trim()) newErrors.name = 'Name is required';
    if (!datasetFormData.description.trim())
      newErrors.description = 'Description is required';
    if (!datasetFormData.file) newErrors.file = 'File is required';

    setDatasetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDatasetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDatasetForm() && projectId && datasetFormData.file) {
      createDatasetMutation.mutate({
        projectId,
        name: datasetFormData.name,
        description: datasetFormData.description,
        file: datasetFormData.file,
      });
    }
  };

  const handleUpdateDatasetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setUpdateDatasetFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (updateDatasetErrors[name]) {
      setUpdateDatasetErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUpdateDatasetFormData((prev) => ({
      ...prev,
      file,
    }));
    if (updateDatasetErrors.file) {
      setUpdateDatasetErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const resetUpdateDatasetForm = () => {
    setUpdateDatasetFormData({
      name: '',
      description: '',
      file: null,
    });
    setUpdateDatasetErrors({});
    setSelectedDataset(null);
  };

  const validateUpdateDatasetForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!updateDatasetFormData.name.trim()) newErrors.name = 'Name is required';
    if (!updateDatasetFormData.description.trim())
      newErrors.description = 'Description is required';

    setUpdateDatasetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateDatasetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUpdateDatasetForm() && selectedDataset) {
      updateDatasetMutation.mutate({
        datasetId: selectedDataset.id,
        name: updateDatasetFormData.name,
        description: updateDatasetFormData.description,
        file: updateDatasetFormData.file || undefined,
      });
    }
  };

  const handleUpdateDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setUpdateDatasetFormData({
      name: dataset.name,
      description: dataset.description,
      file: null,
    });
    setUpdateDatasetOpen(true);
  };

  const handleDeleteDataset = (datasetId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this dataset? This action cannot be undone.',
      )
    ) {
      deleteDatasetMutation.mutate(datasetId);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Draft';
      case 2:
        return 'Active';
      case 3:
        return 'Completed';
      case 4:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 2:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 3:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 4:
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  if (!projectId) {
    return (
      <ContentLayout title="Project Not Found">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Project ID is required</p>
          <Button
            onClick={() => navigate(paths.app.projects.getHref())}
            className="mt-4"
          >
            Back to Projects
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      title="Research Project Details"
      description={
        project
          ? `Comprehensive view of ${project.code}`
          : 'Loading project details...'
      }
    >
      {projectLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : project ? (
        <div className="space-y-6">
          {/* Project Header */}
          <div className="border-border from-muted/50 to-muted/30 rounded-xl border bg-linear-to-br p-6 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-foreground text-3xl font-bold tracking-tight">
                    {project.name}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium ${getStatusColor(project.status)}`}
                  >
                    {getStatusText(project.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-muted-foreground bg-background/60 rounded-md px-3 py-1.5 font-mono text-sm">
                    {project.code}
                  </p>
                  <span className="text-muted-foreground text-sm">
                    Created {formatDate(project.createdOnUtc)} by{' '}
                    {project.createdBy || 'System'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdate}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className="border-border rounded-xl border shadow-sm">
            <div className="border-border bg-muted/30 border-b px-6 py-4">
              <h2 className="text-foreground text-lg font-semibold">
                Project Overview
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Description
                  </dt>
                  <dd className="text-foreground bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">
                    {project.description || 'No description provided'}
                  </dd>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Research Timeline
                    </dt>
                    <dd className="text-foreground space-y-2">
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                        <span className="text-muted-foreground text-xs font-medium">
                          Start Date
                        </span>
                        <span className="text-sm font-semibold">
                          {formatDate(project.startDate)}
                        </span>
                      </div>
                      <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                        <span className="text-muted-foreground text-xs font-medium">
                          End Date
                        </span>
                        <span className="text-sm font-semibold">
                          {formatDate(project.endDate)}
                        </span>
                      </div>
                    </dd>
                  </div>

                  <div className="space-y-2">
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Project Status
                    </dt>
                    <dd className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-medium">
                          {getStatusText(project.status)}
                        </span>
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusColor(project.status)}`}
                        >
                          {getStatusText(project.status)}
                        </span>
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Datasets Section */}
          <div className="border-border rounded-xl border shadow-sm">
            <div className="border-border bg-muted/30 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-foreground text-lg font-semibold">
                    Research Datasets
                  </h2>
                  {datasets && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {datasets.result.paging.totalCount} dataset
                      {datasets.result.paging.totalCount !== 1 ? 's' : ''}{' '}
                      uploaded
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setAddDatasetOpen(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Upload Dataset
                </Button>
              </div>
            </div>
            <div className="p-6">
              {datasetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : datasets && datasets.result.items.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {datasets.result.items.map((dataset) => (
                      <DatasetCard
                        key={dataset.id}
                        dataset={dataset}
                        onUpdate={handleUpdateDataset}
                        onDelete={handleDeleteDataset}
                      />
                    ))}
                  </div>
                  {/* Pagination Controls */}
                  {datasets.result.paging.totalPages > 1 && (
                    <div className="border-border mt-6 flex items-center justify-center gap-2 border-t pt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDatasetPage((prev) => prev - 1)}
                        disabled={!datasets.result.paging.hasPreviousPage}
                      >
                        Previous
                      </Button>
                      <div className="bg-muted text-muted-foreground flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium">
                        {datasets.result.paging.pageNumber} /{' '}
                        {datasets.result.paging.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDatasetPage((prev) => prev + 1)}
                        disabled={!datasets.result.paging.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-muted/30 rounded-lg py-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    No datasets uploaded yet
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Upload your first dataset to begin analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Button
            onClick={() => navigate(paths.app.projects.getHref())}
            className="mt-4"
          >
            Back to Projects
          </Button>
        </div>
      )}

      {/* Update Project Sheet */}
      <Sheet open={updateOpen} onOpenChange={setUpdateOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-150">
          <form onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>Update Project</SheetTitle>
              <SheetDescription>
                Update the project details. Fields marked with * are required.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="update-name"
                    className="text-foreground text-sm font-medium"
                  >
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="update-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Project name"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="update-code"
                    className="text-foreground text-sm font-medium"
                  >
                    Code <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="update-code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Project code"
                  />
                  {errors.code && (
                    <p className="text-destructive text-sm">{errors.code}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="update-description"
                  className="text-foreground text-sm font-medium"
                >
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="update-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                  rows={3}
                  className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                />
                {errors.description && (
                  <p className="text-destructive text-sm">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="update-status"
                  className="text-foreground text-sm font-medium"
                >
                  Status <span className="text-destructive">*</span>
                </label>
                <select
                  id="update-status"
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
                  htmlFor="update-startDate"
                  className="text-foreground text-sm font-medium"
                >
                  Start Date
                </label>
                <Input
                  id="update-startDate"
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="update-endDate"
                  className="text-foreground text-sm font-medium"
                >
                  End Date
                </label>
                <Input
                  id="update-endDate"
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
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="min-w-25"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Project'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Dataset Sheet */}
      <Sheet open={addDatasetOpen} onOpenChange={setAddDatasetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-150">
          <form onSubmit={handleDatasetSubmit}>
            <SheetHeader>
              <SheetTitle>Add Dataset</SheetTitle>
              <SheetDescription>
                Upload a new dataset for this project. All fields are required.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <label
                  htmlFor="dataset-name"
                  className="text-foreground text-sm font-medium"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="dataset-name"
                  name="name"
                  value={datasetFormData.name}
                  onChange={handleDatasetChange}
                  placeholder="e.g., File Salary"
                />
                {datasetErrors.name && (
                  <p className="text-destructive text-sm">
                    {datasetErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dataset-description"
                  className="text-foreground text-sm font-medium"
                >
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="dataset-description"
                  name="description"
                  value={datasetFormData.description}
                  onChange={handleDatasetChange}
                  placeholder="Enter dataset description"
                  rows={3}
                  className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                />
                {datasetErrors.description && (
                  <p className="text-destructive text-sm">
                    {datasetErrors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="dataset-file"
                  className="text-foreground text-sm font-medium"
                >
                  File <span className="text-destructive">*</span>
                </label>
                <Input
                  id="dataset-file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls,.json"
                  className="cursor-pointer"
                />
                {datasetFormData.file && (
                  <p className="text-muted-foreground text-xs">
                    Selected: {datasetFormData.file.name}
                  </p>
                )}
                {datasetErrors.file && (
                  <p className="text-destructive text-sm">
                    {datasetErrors.file}
                  </p>
                )}
              </div>
            </div>

            <SheetFooter className="gap-2">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetDatasetForm}
                  disabled={createDatasetMutation.isPending}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={createDatasetMutation.isPending}
                className="min-w-25"
              >
                {createDatasetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Add Dataset'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Update Dataset Sheet */}
      <Sheet open={updateDatasetOpen} onOpenChange={setUpdateDatasetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-150">
          <form onSubmit={handleUpdateDatasetSubmit}>
            <SheetHeader>
              <SheetTitle>Update Dataset</SheetTitle>
              <SheetDescription>
                Update the dataset information. Leave file empty to keep the
                existing file.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <label
                  htmlFor="update-dataset-name"
                  className="text-foreground text-sm font-medium"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="update-dataset-name"
                  name="name"
                  value={updateDatasetFormData.name}
                  onChange={handleUpdateDatasetChange}
                  placeholder="e.g., File Salary"
                />
                {updateDatasetErrors.name && (
                  <p className="text-destructive text-sm">
                    {updateDatasetErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="update-dataset-description"
                  className="text-foreground text-sm font-medium"
                >
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="update-dataset-description"
                  name="description"
                  value={updateDatasetFormData.description}
                  onChange={handleUpdateDatasetChange}
                  placeholder="Enter dataset description"
                  rows={3}
                  className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                />
                {updateDatasetErrors.description && (
                  <p className="text-destructive text-sm">
                    {updateDatasetErrors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="update-dataset-file-2"
                  className="text-foreground text-sm font-medium"
                >
                  File (Optional - Leave empty to keep existing)
                </label>
                <Input
                  id="update-dataset-file-2"
                  type="file"
                  onChange={handleUpdateFileChange}
                  accept=".csv,.xlsx,.xls,.json"
                  className="cursor-pointer"
                />
                {updateDatasetFormData.file && (
                  <p className="text-muted-foreground text-xs">
                    New file: {updateDatasetFormData.file.name}
                  </p>
                )}
                {selectedDataset && !updateDatasetFormData.file && (
                  <p className="text-muted-foreground text-xs">
                    Current file: {selectedDataset.filePath.split('/').pop()}
                  </p>
                )}
                {updateDatasetErrors.file && (
                  <p className="text-destructive text-sm">
                    {updateDatasetErrors.file}
                  </p>
                )}
              </div>
            </div>

            <SheetFooter className="gap-2">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetUpdateDatasetForm}
                  disabled={updateDatasetMutation.isPending}
                >
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={updateDatasetMutation.isPending}
                className="min-w-25"
              >
                {updateDatasetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Dataset'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </ContentLayout>
  );
};

export default ProjectDetailRoute;
