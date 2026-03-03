import { AxiosProgressEvent } from 'axios';

import { api } from '@/lib/api-client';

import { PAPER_MANAGEMENT_API } from '../constants';
import { ParsePaperResponse } from '../types';

export const parsePaperFile = (
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  signal?: AbortSignal,
): Promise<ParsePaperResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(PAPER_MANAGEMENT_API.PARSE_PAPER, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: 1200000, // 20 minutes timeout for PDF parsing
    signal, // Pass abort signal to axios
  });
};
