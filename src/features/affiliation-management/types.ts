export type AffiliationDto = {
  id: string;
  name: string;
  shortName: string | null;
  rorId: string | null;
  rorUrl: string | null;
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

export type GetAffiliationsResult = {
  items: AffiliationDto[];
  paging: PagingResult;
};

export type GetAffiliationsResultApiResponse = {
  result: GetAffiliationsResult;
};

export type GetAffiliationsParams = {
  Name?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateAffiliationDto = {
  name: string;
  shortName?: string;
  rorId?: string;
  rorUrl?: string;
};

export type UpdateAffiliationDto = {
  name?: string;
  shortName?: string;
  rorId?: string;
  rorUrl?: string;
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
