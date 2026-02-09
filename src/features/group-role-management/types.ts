// Types derived from user.service OpenAPI spec for Groups & Roles

export type GroupDto = {
  id: string | null;
  name: string | null;
  path: string | null;
  subGroups: GroupDto[] | null;
};

export type RoleDto = {
  id: string | null;
  name: string | null;
  description: string | null;
  composite: boolean;
  clientRole: boolean;
};

export type GroupDtoListApiGetResponse = {
  result: GroupDto[] | null;
};

export type RoleDtoListApiGetResponse = {
  result: RoleDto[] | null;
};

export type BooleanApiUpdatedResponse = {
  value: boolean;
};

export type BooleanApiDeletedResponse = {
  value: boolean;
};
