import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export const getMemberAffiliations = (
  memberId: string,
  params?: { PageNumber?: number; PageSize?: number; affiliationName?: string },
): Promise<any> => {
  return api.get(
    `/management-service/projects/members/${memberId}/affiliations`,
    {
      params: { PageNumber: 1, PageSize: 1000, ...params },
    },
  );
};

export const getMemberAffiliationsQueryOptions = (
  memberId: string,
  params?: { PageNumber?: number; PageSize?: number; affiliationName?: string },
) => {
  return queryOptions({
    queryKey: ['member-affiliations', memberId, params],
    queryFn: () => getMemberAffiliations(memberId, params),
    enabled: !!memberId,
  });
};

type UseMemberAffiliationsOptions = {
  memberId: string | null;
  params?: { PageNumber?: number; PageSize?: number; affiliationName?: string };
  queryConfig?: QueryConfig<typeof getMemberAffiliationsQueryOptions>;
};

export const useMemberAffiliations = (
  { memberId, params, queryConfig }: UseMemberAffiliationsOptions = {
    memberId: null,
  },
) => {
  return useQuery({
    ...getMemberAffiliationsQueryOptions(memberId!, params),
    ...queryConfig,
    enabled: !!memberId && (queryConfig?.enabled ?? true),
  });
};
