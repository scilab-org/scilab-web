import { api } from '@/lib/api-client';

import { PAPER_MANAGEMENT_API } from '../constants';
import { AutoTagRequest, AutoTagResponse } from '../types';

const normalizeAutoTagResponse = (response: unknown): AutoTagResponse => {
  if (!response || typeof response !== 'object') {
    return { tags: [] };
  }

  const payload = response as Record<string, unknown>;
  const result =
    payload.result && typeof payload.result === 'object'
      ? (payload.result as Record<string, unknown>)
      : payload;

  const tagsValue = result.tags ?? payload.tags;

  return {
    tags: Array.isArray(tagsValue)
      ? tagsValue.filter((tag): tag is string => typeof tag === 'string')
      : [],
  };
};

export const autoTagPaper = (
  data: AutoTagRequest,
): Promise<AutoTagResponse> => {
  const payload = {
    ...data,
    parsedText: String(data.parsedText ?? ''),
  };

  return api
    .post(PAPER_MANAGEMENT_API.AUTO_TAG, payload)
    .then((response) => normalizeAutoTagResponse(response));
};
