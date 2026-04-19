export type DateTaskFilterField =
  | 'StartDate'
  | 'NextReviewDate'
  | 'CompleteDate'
  | 'CreatedOn';

export type TaskItem = {
  id: string;
  paperId: string;
  subProjectId: string | null;
  projectId: string | null;
  paperTitle?: string | null;
  paperContributorId: string;
  memberId: string;
  name: string;
  description: string | null;
  taskType: number;
  assignedToUserName: string | null;
  sectionId: string | null;
  sectionTitle: string | null;
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
  sectionId?: string | null;
  name: string;
  description: string;
  memberId: string;
  status: number;
  type: number;
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
  subProjectId?: string;
};

export type GetMyAssignedPapersParams = {
  title?: string;
  ProjectCode?: string;
  ProjectId?: string;
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
