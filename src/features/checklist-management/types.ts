export type CheckListDto = {
  id: string;
  section: string;
  ruleName: string;
  item: string;
  weight: number;
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
  RuleName?: string;
  Item?: string;
  Weight?: number;
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateCheckListDto = {
  section: string;
  ruleName: string;
  item: string;
  weight: number;
};

export type UpdateCheckListDto = {
  section: string;
  ruleName: string;
  item: string;
  weight: number;
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
