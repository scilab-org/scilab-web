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

export type GetProjectsParams = {
  Name?: string;
  Code?: string;
  Status?: string;
  IsDeleted?: string;
  PageNumber?: number;
  PageSize?: number;
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

export type GetProjectByIdResultApiResponse = {
  result: {
    project: Project;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  result: T;
  errors: string[] | null;
};
