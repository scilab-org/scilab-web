import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_TEMPLATE_MANAGEMENT_API,
  PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import {
  GetPaperTemplatesParams,
  GetPaperTemplatesResultApiResponse,
} from '../types';

export const getPaperTemplates = (
  params: GetPaperTemplatesParams = {},
): Promise<GetPaperTemplatesResultApiResponse> => {
  return api.get(PAPER_TEMPLATE_MANAGEMENT_API.PAPER_TEMPLATES, { params });
};

export const getPaperTemplatesQueryOptions = (
  params: GetPaperTemplatesParams = {},
) => {
  return queryOptions({
    queryKey: [PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS.PAPER_TEMPLATES, params],
    queryFn: () => getPaperTemplates(params),
  });
};

type UsePaperTemplatesOptions = {
  params?: GetPaperTemplatesParams;
  queryConfig?: QueryConfig<typeof getPaperTemplatesQueryOptions>;
};

export const usePaperTemplates = ({
  params = {},
  queryConfig,
}: UsePaperTemplatesOptions = {}) => {
  return useQuery({
    ...getPaperTemplatesQueryOptions(params),
    ...queryConfig,
  });
};
