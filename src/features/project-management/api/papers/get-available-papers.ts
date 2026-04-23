import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import {
  PROJECT_MANAGEMENT_API,
  PROJECT_MANAGEMENT_QUERY_KEYS,
} from '../../constants';

type GetAvailablePapersParams = {
  Title?: string;
  Author?: string[];
  Publisher?: string;
  Abstract?: string;
  Doi?: string;
  Status?: number;
  FromPublicationDate?: string;
  ToPublicationDate?: string;
  PaperType?: string;
  JournalName?: string;
  ConferenceName?: string;
  Keyword?: string[];
  Tag?: string[];
  ExistingPaperIds?: string[];
  PageNumber?: number;
  PageSize?: number;
};

export const getAvailablePapers = async (
  projectId: string,
  params?: GetAvailablePapersParams,
) => {
  const searchParams = new URLSearchParams();
  if (params?.Title) searchParams.append('Title', params.Title);
  if (params?.Author?.length)
    params.Author.forEach((author) => searchParams.append('Author', author));
  if (params?.Publisher) searchParams.append('Publisher', params.Publisher);
  if (params?.Abstract) searchParams.append('Abstract', params.Abstract);
  if (params?.Doi) searchParams.append('Doi', params.Doi);
  if (params?.Status != null)
    searchParams.append('Status', String(params.Status));
  if (params?.FromPublicationDate)
    searchParams.append('FromPublicationDate', params.FromPublicationDate);
  if (params?.ToPublicationDate)
    searchParams.append('ToPublicationDate', params.ToPublicationDate);
  if (params?.PaperType) searchParams.append('PaperType', params.PaperType);
  if (params?.JournalName)
    searchParams.append('JournalName', params.JournalName);
  if (params?.ConferenceName)
    searchParams.append('ConferenceName', params.ConferenceName);
  if (params?.Keyword?.length)
    params.Keyword.forEach((keyword) =>
      searchParams.append('Keyword', keyword),
    );
  if (params?.Tag?.length)
    params.Tag.forEach((t) => searchParams.append('Tag', t));
  if (params?.ExistingPaperIds?.length)
    params.ExistingPaperIds.forEach((paperId) =>
      searchParams.append('ExistingPaperIds', paperId),
    );
  if (params?.PageNumber != null)
    searchParams.append('PageNumber', String(params.PageNumber));
  if (params?.PageSize != null)
    searchParams.append('PageSize', String(params.PageSize));
  const query = searchParams.toString();
  const url = `${PROJECT_MANAGEMENT_API.PROJECT_PAPERS_AVAILABLE(projectId)}${query ? `?${query}` : ''}`;
  return api.get(url);
};

type UseAvailablePapersOptions = {
  projectId: string;
  params?: GetAvailablePapersParams;
  queryConfig?: any;
};

export const useAvailablePapers = ({
  projectId,
  params,
  queryConfig,
}: UseAvailablePapersOptions) => {
  return useQuery({
    queryKey: [
      PROJECT_MANAGEMENT_QUERY_KEYS.AVAILABLE_PAPERS,
      projectId,
      params,
    ],
    queryFn: () => getAvailablePapers(projectId, params),
    ...queryConfig,
  });
};
