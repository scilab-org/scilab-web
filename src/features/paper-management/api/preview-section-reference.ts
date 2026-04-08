import { api } from '@/lib/api-client';

export type PreviewReferencePaperBank = {
  id: string;
  title: string | null;
  authors: string | null;
  publisher: string | null;
  abstract: string | null;
  doi: string | null;
  filePath: string | null;
  status: number;
  parsedText: string | null;
  isIngested: boolean;
  isAutoTagged: boolean;
  publicationDate: string | null;
  paperType: string | null;
  journalName: string | null;
  pages: string | null;
  number: string | null;
  volume: string | null;
  conferenceName: string | null;
  referenceContent: string | null;
  tagNames: string[];
};

export type PreviewSectionReferenceResponse = {
  result: {
    referenceContent: string;
    paperBanks: PreviewReferencePaperBank[];
  };
};

export const previewSectionReference = async (
  paperBankIds: string[],
): Promise<PreviewSectionReferenceResponse> => {
  const response = await api.post('/lab-service/sections/reference/preview', {
    paperBankIds,
  });

  const record = (response ?? {}) as unknown as Record<string, unknown>;
  const result = (record.result ?? {}) as Record<string, unknown>;

  const paperBanks = Array.isArray(result.paperBanks)
    ? result.paperBanks.map((bank: Record<string, unknown>) => ({
        id: String(bank.id ?? ''),
        title: (bank.title as string | null) ?? null,
        authors: (bank.authors as string | null) ?? null,
        publisher: (bank.publisher as string | null) ?? null,
        abstract: (bank.abstract as string | null) ?? null,
        doi: (bank.doi as string | null) ?? null,
        filePath: (bank.filePath as string | null) ?? null,
        status: Number(bank.status ?? 0),
        parsedText: (bank.parsedText as string | null) ?? null,
        isIngested: Boolean(bank.isIngested),
        isAutoTagged: Boolean(bank.isAutoTagged),
        publicationDate: (bank.publicationDate as string | null) ?? null,
        paperType: (bank.paperType as string | null) ?? null,
        journalName: (bank.journalName as string | null) ?? null,
        pages: (bank.pages as string | null) ?? null,
        number: (bank.number as string | null) ?? null,
        volume: (bank.volume as string | null) ?? null,
        conferenceName: (bank.conferenceName as string | null) ?? null,
        referenceContent: (bank.referenceContent as string | null) ?? null,
        tagNames: Array.isArray(bank.tagNames)
          ? bank.tagNames.filter(
              (tag: unknown): tag is string => typeof tag === 'string',
            )
          : [],
      }))
    : [];

  return {
    result: {
      referenceContent:
        typeof result.referenceContent === 'string'
          ? result.referenceContent
          : '',
      paperBanks,
    },
  };
};
