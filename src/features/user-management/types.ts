// Types derived from user.service OpenAPI spec

export type PagingResult = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasItem: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type UserDto = {
  id: string | null;
  username: string | null;
  email: string | null;
  ocrId: string | null;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  avatarUrl: string | null;
  groups: GroupDto[] | null;
};

export type GroupDto = {
  id: string | null;
  name: string | null;
  path: string | null;
  subGroups: GroupDto[] | null;
};

export type CreateUserDto = {
  username: string | null;
  email: string | null;
  ocrId: string | null;
  firstName: string | null;
  lastName: string | null;
  initialPassword: string | null;
  temporaryPassword: boolean;
  groupNames: string[] | null;
  avatarImage: File | null;
};

export type UpdateUserDto = {
  ocrId: string | null;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  groupNames: string[] | null;
  avatarImage: File | null;
};

export type GetUsersResult = {
  items: UserDto[] | null;
  paging: PagingResult;
};

export type GetUsersResultApiGetResponse = {
  result: GetUsersResult;
};

export type GetUserByIdResult = {
  user: UserDto;
};

export type GetUserByIdResultApiGetResponse = {
  result: GetUserByIdResult;
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

export type GetUsersParams = {
  searchText?: string;
  groupName?: string;
  enabled?: string;
  pageNumber?: number;
  pageSize?: number;
};
