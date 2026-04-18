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
  context: string;
  domain: string;
  keypoint: string;
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
  endDate: string | null;
  context: string;
  domain: string;
  keypoint: string;
};

export type UpdateProjectDto = {
  name: string;
  code: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string | null;
  context: string;
  domain: string;
  keypoint: string;
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

export type ProjectMember = {
  memberId: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  role: string;
  joinedAt: string;
};

export type GetProjectMembersResult = {
  items: ProjectMember[];
  paging: PagingResult;
};

export type ProjectMembersResponse = {
  success: boolean;
  message: string | null;
  result: GetProjectMembersResult;
  errors: string[] | null;
};

export type AvailableUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  groups: string[];
};

export type GetAvailableUsersResult = {
  items: AvailableUser[];
  paging?: PagingResult;
};

export type AvailableUsersResponse = {
  success: boolean;
  message: string | null;
  result: GetAvailableUsersResult;
  errors: string[] | null;
};

export type AddManagersRequest = {
  userId: string;
};

export type AddProjectMembersRequest = {
  members: Array<{
    userId: string;
    groupName: string;
  }>;
};

export type RemoveMembersRequest = {
  memberIds: string[];
};

export type GetProjectMembersParams = {
  searchEmail?: string;
  pageNumber?: number;
  pageSize?: number;
  projectRole?: string;
};

export type GetAvailableUsersParams = {
  searchText?: string;
  adminGroupName?: string;
};

// ─── Project Papers ─────────────────────────────────────────────────────────

export type ProjectPaper = {
  id: string;
  subProjectId: string | null;
  title: string | null;
  authors: string | null;
  abstract: string | null;
  doi: string | null;
  filePath: string | null;
  status: number | null;
  publicationDate: string | null;
  paperType: string | null;
  journalName: string | null;
  conferenceName: string | null;
  conferenceJournalStartAt?: string | null;
  conferenceJournalEndAt?: string | null;
  tagNames: string[];
};

export type GetProjectPapersResult = {
  items: ProjectPaper[];
  totalCount: number;
};

export type GetProjectPapersParams = {
  Title?: string;
  Tag?: string[];
  PageNumber?: number;
  PageSize?: number;
};

export type AddProjectPapersRequest = {
  paperIds: string[];
};

export type RemoveProjectPapersRequest = {
  paperIds: string[];
};

// ─── Sub-Projects (authored papers within project) ──────────────────────────

export type SubProjectPaper = {
  id: string;
  subProjectId: string | null;
  template: string | null;
  context: string | null;
  parsedText: string | null;
  title: string | null;
  abstract: string | null;
  doi: string | null;
  filePath: string | null;
  status: number | null;
  submissionStatus: number | null;
  publicationDate: string | null;
  paperType: string | null;
  journalName: string | null;
  conferenceName: string | null;
  conferenceJournalStartAt?: string | null;
  conferenceJournalEndAt?: string | null;
  tagNames: string[];
  createdBy: string | null;
  createdOnUtc?: string;
  lastModifiedOnUtc?: string;
  lastModifiedBy?: string | null;
  researchGap?: string;
  mainContribution?: string;
  rule?: string;
  gapType?: string;
  styleName?: string;
  styleDescription?: string;
  styleRule?: string;
};

export type GetSubProjectsResult = {
  items: SubProjectPaper[];
  paging: {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalPages: number;
  };
};

export type GetSubProjectsParams = {
  PageNumber?: number;
  PageSize?: number;
  title?: string;
  subProjectId?: string;
};
