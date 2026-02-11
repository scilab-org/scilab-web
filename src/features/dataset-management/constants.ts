const SERVICE_PREFIX = '/management-service';

export const DATASET_MANAGEMENT_API = {
  DATASETS: `${SERVICE_PREFIX}/datasets`,
  MANAGER_DATASETS: `${SERVICE_PREFIX}/manager/datasets`,
  DATASET_BY_ID: (datasetId: string) =>
    `${SERVICE_PREFIX}/manager/datasets/${datasetId}`,
} as const;

export const DATASET_MANAGEMENT_QUERY_KEYS = {
  DATASETS: 'datasets',
  DATASET: 'dataset',
} as const;
