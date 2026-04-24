export type AuthorRoleDto = {
  id: string;
  name: string;
  description: string | null;
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

export type GetAuthorRolesResult = {
  items: AuthorRoleDto[];
  paging: PagingResult;
};

export type GetAuthorRolesResultApiResponse = {
  result: GetAuthorRolesResult;
};

export type GetAuthorRolesParams = {
  Name?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateAuthorRoleDto = {
  name: string;
  description: string;
};

export type UpdateAuthorRoleDto = {
  name: string;
  description: string;
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
