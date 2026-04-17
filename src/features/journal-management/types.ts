export type JournalDto = {
  id: string;
  name: string;
  ranking: string | null;
  url: string | null;
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

export type PaperRef = {
  id: string;
  title: string;
  conferenceJournalStartAt: string | null;
  conferenceJournalEndAt: string | null;
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
    papers: PaperRef[];
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
  ranking: string;
  url: string;
  style: string;
  texFile?: File | null;
  pdfFile?: File | null;
};

export type UpdateJournalDto = {
  name?: string;
  ranking?: string;
  url?: string;
  style?: string;
  texFile?: File | null;
  pdfFile?: File | null;
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
