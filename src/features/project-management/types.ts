// Types for project management

export type PagingResult = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasItem: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Project = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  modifiedAt: string;
  createdOnUtc: string;
};

export type CreateProjectDto = {
  name: string;
  code: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
};

export type UpdateProjectDto = {
  name: string;
  code: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
};

export type Dataset = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  filePath: string;
  status: number;
  createdOnUtc: string;
  modifiedOnUtc: string;
};

export type CreateDatasetDto = {
  projectId: string;
  name: string;
  description: string;
  file: File;
};

export type UpdateDatasetDto = {
  datasetId: string;
  name: string;
  description: string;
  file?: File;
};

export type GetDatasetsParams = {
  projectId: string;
  pageNumber?: number;
  pageSize?: number;
};

export type GetDatasetsResult = {
  items: Dataset[];
  paging: PagingResult;
};

export type DatasetsResponse = {
  success: boolean;
  message: string | null;
  result: GetDatasetsResult;
  errors: string[] | null;
};

export type GetProjectsParams = {
  searchText?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type GetProjectsResult = {
  items: Project[];
  paging: PagingResult;
};

export type ProjectsResponse = {
  success: boolean;
  message: string | null;
  result: GetProjectsResult;
  errors: string[] | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  result: T;
  errors: string[] | null;
};
