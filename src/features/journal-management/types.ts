export type JournalDto = {
  id: string;
  name: string;
  startAt: string | null;
  endAt: string | null;
  texFile: string | null;
  pdfFile: string | null;
  style: string | null;
  templateId: string | null;
  templateCode: string | null;
  projectIds: string[];
  createdOnUtc: string | null;
  createdBy: string | null;
  lastModifiedOnUtc: string | null;
  lastModifiedBy: string | null;
};

export type ProjectRef = {
  id: string;
  name: string;
  code: string;
};

export type PagingResult = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasItem: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type GetJournalsResult = {
  items: JournalDto[];
  paging: PagingResult;
};

export type GetJournalsResultApiResponse = {
  result: GetJournalsResult;
};

export type GetJournalByIdResultApiResponse = {
  result: {
    journal: JournalDto;
    projects: ProjectRef[];
  };
};

export type GetJournalsParams = {
  Name?: string;
  TemplateCode?: string;
  ProjectName?: string;
  ProjectCode?: string;
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateJournalDto = {
  name: string;
  templateId: string;
  startAt: string;
  endAt: string;
  style: string;
  texFile: File;
  pdfFile: File;
};

export type UpdateJournalDto = {
  startAt?: string;
  endAt?: string;
};

export type StringApiCreatedResponse = {
  value: string | null;
};

export type BooleanApiUpdatedResponse = {
  value: boolean;
};

export type BooleanApiDeletedResponse = {
  value: boolean;
};
