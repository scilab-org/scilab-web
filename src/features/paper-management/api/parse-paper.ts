import { AxiosProgressEvent } from 'axios';

import { api } from '@/lib/api-client';

import { PAPER_MANAGEMENT_API } from '../constants';
import { ParsePaperResponse } from '../types';

const normalizeParseResponse = (response: unknown): ParsePaperResponse => {
  if (!response || typeof response !== 'object') {
    return { parsedText: '' };
  }

  const payload = response as Record<string, unknown>;
  const result =
    payload.result && typeof payload.result === 'object'
      ? (payload.result as Record<string, unknown>)
      : payload;

  const parsedTextValue =
    result.parsedText ??
    result.parsedtext ??
    payload.parsedText ??
    payload.parsedtext;

  return {
    parsedText: String(parsedTextValue ?? ''),
  };
};

export const parsePaperFile = (
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  signal?: AbortSignal,
): Promise<ParsePaperResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return api
    .post(PAPER_MANAGEMENT_API.PARSE_PAPER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      signal,
    })
    .then((response) => normalizeParseResponse(response));
};
