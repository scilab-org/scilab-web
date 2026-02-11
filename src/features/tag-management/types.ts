export type TagDto = {
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

export type GetTagsResult = {
  items: TagDto[];
  paging: PagingResult;
};

export type GetTagsResultApiResponse = {
  result: GetTagsResult;
};

export type GetTagByIdResultApiResponse = {
  result: TagDto;
};

export type GetTagsParams = {
  Name?: string;
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateTagDto = {
  name: string;
};

export type UpdateTagDto = {
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
