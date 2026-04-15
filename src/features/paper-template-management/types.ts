export type PagingResult = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasItem: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TemplateSectionDto = {
  title: string;
  sectionRule: string;
  displayOrder: number;
};

export type PaperTemplateDto = {
  id: string;
  code: string;
  description: string;
  sections: TemplateSectionDto[];
  createdOnUtc: string;
  lastModifiedOnUtc: string;
};

export type GetPaperTemplatesResult = {
  items: PaperTemplateDto[];
  paging: PagingResult;
};

export type GetPaperTemplatesResultApiResponse = {
  result: GetPaperTemplatesResult;
};

export type GetPaperTemplatesParams = {
  Description?: string;
  Code?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateTemplateSectionInput = {
  title: string;
  sectionRule: string;
  displayOrder: number;
};

export type CreatePaperTemplateDto = {
  code: string;
  description: string;
  sections: CreateTemplateSectionInput[];
};

export type GetPaperTemplateByIdApiResponse = {
  result: {
    template: PaperTemplateDto;
  };
};

export type UpdatePaperTemplateDto = {
  description: string;
  sections: CreateTemplateSectionInput[];
};

export type StringApiCreatedResponse = {
  value: string | null;
};
