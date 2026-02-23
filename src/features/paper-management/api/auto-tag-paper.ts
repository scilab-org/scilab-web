import { api } from '@/lib/api-client';

import { PAPER_MANAGEMENT_API } from '../constants';
import { AutoTagRequest, AutoTagResponse } from '../types';

export const autoTagPaper = (
  data: AutoTagRequest,
): Promise<AutoTagResponse> => {
  return api.post(PAPER_MANAGEMENT_API.AUTO_TAG, data);
};
