export type DateTaskFilterField =
  | 'StartDate'
  | 'NextReviewDate'
  | 'CompleteDate'
  | 'CreatedOn';

export type TaskItem = {
  id: string;
  paperId: string;
  paperTitle?: string | null;
  paperContributorId: string;
  name: string;
  description: string | null;
  assignedToUserName: string;
  status: number;
  startDate: string | null;
  nextReviewDate: string | null;
  completeDate: string | null;
  createdBy: string;
  createdOnUtc: string;
  lastModifiedOnUtc: string;
  lastModifiedBy: string | null;
};

export type GetMyTasksParams = {
  PageNumber?: number;
  PageSize?: number;
  AssignedToUserName?: string;
  Status?: string;
  PaperId?: string;
  DateField?: DateTaskFilterField;
  FromDate?: string;
  ToDate?: string;
};

export type PagingInfo = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasItem: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CreateTaskDto = {
  paperId: string;
  name: string;
  description: string;
  assignedToUserName: string;
  status: number;
  startDate: string;
  nextReviewDate?: string | null;
  completeDate?: string | null;
};

export type UpdateTaskDto = {
  name: string;
  description: string;
  assignedToUserName: string;
  status: number;
  startDate: string;
  nextReviewDate?: string | null;
};

export type TasksResponse = {
  result: {
    items: TaskItem[];
    paging?: PagingInfo;
  };
};

export type AssignedPaperItem = {
  id: string;
  title: string;
};

export type GetMyAssignedPapersParams = {
  title?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type AssignedPapersResponse = {
  result: {
    items: AssignedPaperItem[];
    paging: {
      totalCount: number;
      pageNumber: number;
      pageSize: number;
      hasItem: boolean;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

export type StringApiResponse = {
  value: string;
};
