import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import {
  DATASET_MANAGEMENT_API,
  DATASET_MANAGEMENT_QUERY_KEYS,
} from '../constants';
import { DatasetsResponse, GetDatasetsParams } from '../types';

export const getDatasets = (
  params: GetDatasetsParams,
): Promise<DatasetsResponse> => {
  return api.get(DATASET_MANAGEMENT_API.DATASETS, { params });
};

export const getDatasetsQueryOptions = (params: GetDatasetsParams) => {
  return queryOptions({
    queryKey: [DATASET_MANAGEMENT_QUERY_KEYS.DATASETS, params],
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
    placeholderData: keepPreviousData,
  });
};
