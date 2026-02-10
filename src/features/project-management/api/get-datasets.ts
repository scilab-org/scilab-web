import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { DatasetsResponse, GetDatasetsParams } from '../types';

const DATASET_QUERY_KEY = 'datasets';

export const getDatasets = async (
  params: GetDatasetsParams,
): Promise<DatasetsResponse> => {
  return await api.get(
    `/datasets?projectId=${params.projectId}&PageNumber=${params.pageNumber || 1}&PageSize=${params.pageSize || 5}`,
  );
};

export const getDatasetsQueryOptions = (params: GetDatasetsParams) => {
  return queryOptions({
    queryKey: [DATASET_QUERY_KEY, params],
    queryFn: () => getDatasets(params),
  });
};

type UseDatasetsOptions = {
  params: GetDatasetsParams;
  queryConfig?: QueryConfig<typeof getDatasetsQueryOptions>;
};

export const useDatasets = ({ params, queryConfig }: UseDatasetsOptions) => {
  return useQuery({
    ...getDatasetsQueryOptions(params),
    ...queryConfig,
  });
};
