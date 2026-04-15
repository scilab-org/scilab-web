export type PaperDto = {
  id: string;
  title: string | null;
  abstract: string | null;
  doi: string | null;
  authors: string | null;
  publisher: string | null;
  number: string | null;
  pages: string | null;
  volume: string | null;
  referenceContent: string | null;
  filePath: string | null;
  status: number;
  ingestStatus?: number;
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
    paperBank: PaperDto;
  };
};

export type WritingPaperDto = {
  id: string;
  subProjectId: string | null;
  template: string | null;
  context: string | null;
  title: string | null;
  abstract: string | null;
  doi: string | null;
  authors?: string | null;
  publisher?: string | null;
  number?: string | null;
  pages?: string | null;
  volume?: string | null;
  referenceContent?: string | null;
  filePath: string | null;
  status: number;
  publicationDate: string | null;
  paperType: string | null;
  journalName: string | null;
  conferenceName: string | null;
  tagNames: string[];
  createdOnUtc?: string | null;
  createdBy?: string | null;
  lastModifiedOnUtc?: string | null;
  lastModifiedBy?: string | null;
  researchGap?: string | null;
  researchAim?: string | null;
  mainContribution?: string | null;
  rule?: string | null;
  gapType?: string | null;
  journal?: string | null;
  styleName?: string | null;
  styleDescription?: string | null;
  styleRule?: string | null;
};

export type CombineDto = {
  id: string;
  name: string;
  content: string;
  references: string[] | null;
  isSave: boolean;
  createdBy: string | null;
  createdOnUtc: string | null;
  lastModifiedBy: string | null;
  lastModifiedOnUtc: string | null;
};

export type WritingPaperReference = {
  paperBankId: string;
  sectionIds: string[];
};

export type GetWritingPaperByIdResultApiResponse = {
  result: {
    paper: WritingPaperDto & {
      combines?: CombineDto[];
      references?: WritingPaperReference[];
    };
  };
};

export type GetPapersParams = {
  Title?: string;
  Publisher?: string;
  Abstract?: string;
  Doi?: string;
  Status?: number;
  FromPublicationDate?: string;
  ToPublicationDate?: string;
  PaperType?: string;
  JournalName?: string;
  ConferenceName?: string;
  Author?: string[];
  Tag?: string[];
  IsDeleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
};

export type CreatePaperDto = {
  title: string;
  abstract: string;
  doi: string;
  authors: string;
  publisher: string;
  number: string;
  publicationDate: string;
  paperType: string;
  journalName: string;
  conferenceName: string;
  pages: string;
  volume: string;
  referenceContent: string;
  file: File;
  parsedText: string;
  tagNames: string[];
  isAutoTagged: boolean;
  isIngested: boolean;
  status: number;
};

export type ParsePaperResponse = {
  parsedText: string;
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
  authors?: string;
  publisher?: string;
  number?: string;
  publicationDate?: string;
  paperType?: string;
  journalName?: string;
  conferenceName?: string;
  pages?: string;
  volume?: string;
  referenceContent?: string;
  status?: number;
  tagNames?: string[];
  isAutoTagged?: boolean;
};

export type UpdateWritingPaperDto = {
  context?: string;
  abstract?: string;
  researchGap?: string;
  researchAim?: string;
  gapType?: string;
  mainContribution?: string;
  status?: number;
  journal?: {
    name: string;
    styleName: string;
    styleDescription: string;
    styleRule: string;
  } | null;
};

export type PaperSection = {
  id: string;
  title: string;
  content?: string;
  packages?: string[];
  numbered: boolean;
  displayOrder: number;
  sectionSumary?: string;
  parentSectionId?: string | null;
  filePath?: string | null;
  paperId?: string;
  sectionRole?: string;
};

export type UpdateSectionDto = {
  sectionId: string;
  memberId: string;
  title: string;
  content: string;
  numbered: boolean;
  sectionSumary: string;
  parentSectionId?: string | null;
  description?: string;
  currentSectionPackages?: string[];
  referencesPackages?: string[];
};

export type CreateSectionDto = {
  id: string;
  title: string;
  content?: string;
  packages?: string[];
  numbered: boolean;
  displayOrder: number;
  sectionSumary?: string;
  description?: string;
  rule?: string;
  parentSectionId?: string | null;
};

export type CreatePaperJournalDto = {
  name: string;
  styleName: string;
  styleDescription?: string;
  styleRule?: string;
};

export type CreatePaperInProjectDto = {
  projectId: string;
  title: string;
  template?: string;
  context: string;
  abstract?: string;
  researchGap?: string;
  gapType?: string;
  mainContribution?: string;
  status?: number;
  journal?: CreatePaperJournalDto;
  sections?: CreateSectionDto[];
};

export type AssignedSection = {
  id: string;
  paperId: string;
  markSectionId: string;
  paperContributorId: string;
  sectionRole: string;
  memberId: string;
  title: string;
  content: string;
  sectionSumary: string;
  description?: string;
  displayOrder: number;
  numbered: boolean;
  filePath: string | null;
  parentSectionId: string | null;
  createdOnUtc?: string;
  lastModifiedOnUtc?: string;
  packages?: string[] | null;
};

export type AssignedSectionsResult = {
  paperId: string;
  subProjectId: string;
  memberId: string;
  items: AssignedSection[];
  paging: PagingResult;
};

export type GetAssignedSectionsParams = {
  PageNumber?: number;
  PageSize?: number;
};

export type GetAssignedSectionsHistoryParams = {
  PageNumber?: number;
  PageSize?: number;
  SectionRole?: 'section:read' | 'section:edit';
  FromDate?: string;
  ToDate?: string;
};

export type GetAssignedSectionsApiResponse = {
  result: AssignedSectionsResult;
};

export type AssignedSectionHistoryItem = {
  id: string;
  paperId: string;
  markSectionId: string;
  paperContributorId: string;
  sectionRole: string;
  memberId: string;
  title: string;
  content: string;
  sectionSumary: string;
  description?: string;
  displayOrder: number;
  numbered: boolean;
  filePath: string | null;
  parentSectionId: string | null;
  version: number;
  createdOnUtc: string;
  lastModifiedOnUtc: string;
  isOldMainSection: boolean;
  isMainSection: boolean;
};

export type AssignedSectionsHistoryResult = {
  items: AssignedSectionHistoryItem[];
  paging: PagingResult;
};

export type GetAssignedSectionsHistoryApiResponse = {
  result: AssignedSectionsHistoryResult;
};

export type AvailableSectionMember = {
  memberId: string;
  userId: string;
  role: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type AvailableSectionMembersResult = {
  sectionId: string;
  paperId: string;
  items: AvailableSectionMember[];
};

export type GetAvailableSectionMembersApiResponse = {
  result: AvailableSectionMembersResult;
};

export type SectionMember = {
  paperContributorId: string;
  memberId: string;
  userId: string;
  sectionRole: string;
  markSectionId: string;
  sectionId: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  id: string;
};

export type GetSectionMembersResult = {
  sectionId: string;
  items: SectionMember[];
};

export type GetSectionMembersApiResponse = {
  result: GetSectionMembersResult;
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

export type PaperContributorItem = {
  id: string;
  paperId: string;
  memberId: string;
  markSectionId: string;
  sectionId: string;
  sectionRole: string;
  userId: string;
  contributorName: string;
  contributorEmail: string;
  firstName: string | null;
  lastName: string | null;
};

export type GetPaperContributorsApiResponse = {
  result: {
    paperId: string;
    items: PaperContributorItem[];
  };
};

export type MarkSectionItem = {
  memberId: string;
  sectionRole: string;
  sectionId: string;
  markSectionId: string;
  title: string;
  isMainSection: boolean;
  parentSectionId: string | null;
  previousVersionSectionId: string | null;
  nextVersionSectionId: string | null;
  name: string;
  email: string;
  content: string;
  description?: string;
  createdOnUtc?: string | null;
  lastModifiedOnUtc?: string | null;
};

export type GetMarkSectionApiResponse = {
  result: { items: MarkSectionItem[] };
};

export type CommentDto = {
  id: string;
  sectionId: string;
  content: string;
  userName: string;
  createdOnUtc: string | null;
  createdBy: string | null;
  lastModifiedOnUtc: string | null;
  lastModifiedBy: string | null;
};

export type GetSectionCommentsApiResponse = {
  result: {
    items: CommentDto[];
  };
};

export type CreateCommentDto = {
  sectionId: string;
  content: string;
};
