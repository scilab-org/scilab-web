import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  PAPER_TEMPLATE_MANAGEMENT_API,
  PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { GetPaperTemplateByIdApiResponse } from '../types';

export const getPaperTemplate = (
  id: string,
): Promise<GetPaperTemplateByIdApiResponse> => {
  return api.get(PAPER_TEMPLATE_MANAGEMENT_API.PAPER_TEMPLATE_BY_ID(id));
};

export const getPaperTemplateQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: [PAPER_TEMPLATE_MANAGEMENT_QUERY_KEYS.PAPER_TEMPLATE, id],
    queryFn: () => getPaperTemplate(id),
  });
};

type UsePaperTemplateOptions = {
  id: string;
  queryConfig?: QueryConfig<typeof getPaperTemplateQueryOptions>;
};

export const usePaperTemplate = ({
  id,
  queryConfig,
}: UsePaperTemplateOptions) => {
  return useQuery({
    ...getPaperTemplateQueryOptions(id),
    ...queryConfig,
  });
};
