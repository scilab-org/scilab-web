export type DomainDto = {
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

export type GetDomainsResult = {
  items: DomainDto[];
  paging: PagingResult;
};

export type GetDomainsResultApiResponse = {
  result: GetDomainsResult;
};

export type GetDomainsParams = {
  Name?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateDomainDto = {
  name: string;
};

export type UpdateDomainDto = {
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
