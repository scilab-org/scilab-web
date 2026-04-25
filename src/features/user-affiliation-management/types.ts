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

export type UserAffiliationDto = {
  id: string;
  userId: string;
  affiliation: AffiliationDto;
  department: string | null;
  position: string | null;
  affiliationStartYear: number | null;
  affiliationEndYear: number | null;
  createdOnUtc: string | null;
  lastModifiedOnUtc: string | null;
};

export type GetUserAffiliationsResultApiResponse = {
  result: UserAffiliationDto[];
};

export type GetUserAffiliationsParams = {
  userId: string;
};

export type CreateUserAffiliationDto = {
  userId: string;
  affiliationId: string;
  department: string;
  position: string;
  affiliationStartYear: number | null;
  affiliationEndYear?: number | null;
};

export type UpdateUserAffiliationDto = {
  userId: string;
  affiliationId: string;
  department: string;
  position: string;
  affiliationStartYear: number;
  affiliationEndYear?: number | null;
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
