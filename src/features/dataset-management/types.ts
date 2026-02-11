// Types for dataset management

export type PagingResult = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasItem: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
  PageNumber?: number;
  PageSize?: number;
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

export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  result: T;
  errors: string[] | null;
};
