export type CheckListItemDto = {
  id: string;
  name: string;
  rule: string;
  weight: number;
};

export type CheckListDto = {
  id: string;
  section: string;
  items: CheckListItemDto[];
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

export type GetCheckListsResult = {
  items: CheckListDto[];
  paging: PagingResult;
};

export type GetCheckListsResultApiResponse = {
  result: GetCheckListsResult;
};

export type GetCheckListByIdApiResponse = {
  result: {
    checkList: CheckListDto;
  };
};

export type GetCheckListsParams = {
  Section?: string;
  Name?: string;
  Weight?: number;
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CheckListItemPayload = {
  id: string;
  name: string;
  rule: string;
  weight: number;
};

export type CreateCheckListDto = {
  section: string;
  items: CheckListItemPayload[];
};

export type UpdateCheckListDto = {
  section: string;
  items?: CheckListItemPayload[];
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
