import { api } from '@/lib/api-client';

import { PAPER_MANAGEMENT_API } from '../constants';
import { AutoTagRequest, AutoTagResponse, KeywordDto } from '../types';

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
      ? tagsValue.map((tag): KeywordDto => {
          // Handle KeywordDto objects from the backend
          if (typeof tag === 'object' && tag !== null) {
            const tagObj = tag as Record<string, unknown>;
            return {
              name: String(tagObj.name ?? ''),
              isFromPaper: Boolean(tagObj.isFromPaper ?? false),
            };
          }
          // Handle legacy string format - mark as not from paper
          if (typeof tag === 'string') {
            return { name: tag, isFromPaper: false };
          }
          return { name: '', isFromPaper: false };
        })
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
