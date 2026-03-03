export type PaperDto = {
  id: string;
  title: string | null;
  abstract: string | null;
  doi: string | null;
  filePath: string | null;
  status: number;
  isIngested: boolean;
  isAutoTagged: boolean;
  parsedText: string | null;
  publicationDate: string | null;
  paperType: string | null;
  journalName: string | null;
  conferenceName: string | null;
  tagNames: string[];
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

export type GetPapersResult = {
  items: PaperDto[];
  paging: PagingResult;
};

export type GetPapersResultApiResponse = {
  result: GetPapersResult;
};

export type GetPaperByIdResultApiResponse = {
  result: {
    paper: PaperDto;
  };
};

export type GetPapersParams = {
  Title?: string;
  Abstract?: string;
  Doi?: string;
  Status?: number;
  FromPublicationDate?: string;
  ToPublicationDate?: string;
  PaperType?: string;
  JournalName?: string;
  ConferenceName?: string;
  Tag?: string[];
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreatePaperDto = {
  title: string;
  abstract: string;
  doi: string;
  publicationDate: string;
  paperType: string;
  journalName: string;
  conferenceName: string;
  file: File;
  parsedText: string;
  tagNames: string[];
  isAutoTagged: boolean;
  isIngested: boolean;
  status: number;
};

export type ParsePaperResponse = {
  parsedText: string;
  tags: string[];
};

export type AutoTagRequest = {
  parsedText: string;
  existingTags: string[];
};

export type AutoTagResponse = {
  tags: string[];
};

export type UpdatePaperDto = {
  title?: string;
  abstract?: string;
  doi?: string;
  publicationDate?: string;
  paperType?: string;
  journalName?: string;
  conferenceName?: string;
  status?: number;
  tagNames?: string[];
  isAutoTagged?: boolean;
};

export type PaperSection = {
  id: string;
  title: string;
  content?: string;
  numbered: boolean;
  displayOrder: number;
  sectionSumary?: string;
  parentSectionId?: string;
};

export type InitializePaperDto = {
  projectId: string;
  title: string;
  abstract: string;
  doi: string;
  status: number;
  paperType: string;
  sections: PaperSection[];
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
