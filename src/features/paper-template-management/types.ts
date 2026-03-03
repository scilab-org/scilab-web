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
  key: string;
  title: string;
  displayOrder?: number;
  order?: number;
  latex?: string;
  numbered?: boolean;
  allowSubsections?: boolean;
  required?: boolean;
};

export type TemplateStructureDto = {
  templateCode: string;
  sections: TemplateSectionDto[];
};

export type PaperTemplateDto = {
  id: string;
  name: string;
  code: string;
  description: string;
  templateStructure: TemplateStructureDto;
  version: number;
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
  Name?: string;
  Code?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type CreateTemplateSectionDto = {
  key: string;
  title: string;
  displayOrder: number;
  latex?: string;
  numbered?: boolean;
  allowSubsections?: boolean;
  required?: boolean;
};

export type CreateTemplateStructureDto = {
  templateCode: string;
  sections: CreateTemplateSectionDto[];
};

export type CreatePaperTemplateDto = {
  name: string;
  code: string;
  description: string;
  templateStructure: CreateTemplateStructureDto;
};

export type GetPaperTemplateByIdApiResponse = {
  result: {
    template: PaperTemplateDto;
  };
};

export type UpdatePaperTemplateDto = {
  description: string;
  templateStructure: CreateTemplateStructureDto;
};

export type StringApiCreatedResponse = {
  value: string | null;
};
