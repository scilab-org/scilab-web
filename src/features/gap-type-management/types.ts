export type GapTypeDto = {
  id: string;
  name: string;
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

export type GetGapTypesResult = {
  items: GapTypeDto[];
  paging: PagingResult;
};

export type GetGapTypesResultApiResponse = {
  result: GetGapTypesResult;
};

export type GetGapTypesParams = {
  Name?: string;
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateGapTypeDto = {
  name: string;
};

export type UpdateGapTypeDto = {
  name?: string;
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
