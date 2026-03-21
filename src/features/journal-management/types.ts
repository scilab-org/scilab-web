export type JournalStyle = {
  name: string;
  description?: string;
  rule?: string;
};

export type JournalDto = {
  id: string;
  name: string;
  styles: JournalStyle[];
  createdOnUtc: string | null;
  createdBy: string | null;
  lastModifiedOnUtc: string | null;
  lastModifiedBy: string | null;
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
  };
};

export type GetJournalsParams = {
  Name?: string;
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateJournalDto = {
  name: string;
  styles?: JournalStyle[];
};

export type UpdateJournalDto = {
  name?: string;
  styles?: JournalStyle[];
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
