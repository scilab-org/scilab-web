import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router';
import { useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';

import { Head } from '@/components/seo';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useWritingPaperDetail,
  getWritingPaperQueryOptions,
} from '@/features/paper-management/api/get-writing-paper';
import { useGetCombineVersion } from '@/features/paper-management/api/get-combine-version';
import { CombineEditor } from '@/features/project-management/components/papers/combine-editor';
import { paths } from '@/config/paths';
import { useSubProjects } from '@/features/project-management/api/papers/get-sub-projects';
import { useMyProjectRole } from '@/features/project-management/api/projects/get-my-role';
import type { CombineDto } from '@/features/paper-management/types';

const NULL_GUID = '00000000-0000-0000-0000-000000000000';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Record<string, string | undefined> }) => {
    const paperId = params.paperId as string;
    const query = getWritingPaperQueryOptions(paperId);
    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch {
      return null;
    }
  };

const ProjectPaperCombineEditorRoute = () => {
  const { projectId, paperId, combineId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const backHref = paths.app.projectPaperDetail.getHref(projectId!, paperId!);

  const isNullGuid = combineId === NULL_GUID;
  const stateData = (location.state as { combine?: CombineDto } | null)
    ?.combine;

  const paperQuery = useWritingPaperDetail({ paperId: paperId! });
  const paper = paperQuery.data?.result?.paper;

  const combineQuery = useGetCombineVersion({
    paperId: paperId!,
    versionId: combineId!,
    queryConfig: { staleTime: 0, refetchOnMount: true, enabled: !isNullGuid },
  });
  const combine: CombineDto | undefined =
    combineQuery.data?.result?.version ?? stateData;

  useEffect(() => {
    if (isNullGuid && !stateData && !combineQuery.isLoading) {
      navigate(backHref, {
        replace: true,
        state: { initialTab: 'sections' },
      });
    }
  }, [isNullGuid, stateData, combineQuery.isLoading, navigate, backHref]);

  useEffect(() => {
    if (!projectId || !paperId) return;
    if (paperQuery.isLoading || (!isNullGuid && combineQuery.isLoading)) return;

    if (!paper || !combine) {
      navigate(backHref, {
        replace: true,
        state: { initialTab: 'sections' },
      });
    }
  }, [
    projectId,
    paperId,
    paper,
    combine,
    backHref,
    isNullGuid,
    paperQuery.isLoading,
    combineQuery.isLoading,
    navigate,
  ]);

  const subProjectsQuery = useSubProjects({
    projectId: projectId!,
    params: { PageSize: 200 },
    queryConfig: { enabled: !!projectId && !paper?.subProjectId } as any,
  });
  const subProjectsList = (subProjectsQuery.data as any)?.result?.items ?? [];
  const matchedSubProject = subProjectsList.find(
    (sp: any) => sp.id === paperId,
  );
  const subProjectId =
    paper?.subProjectId || matchedSubProject?.subProjectId || '';

  const roleQuery = useMyProjectRole({ projectId: projectId! });
  const isAuthor = roleQuery.data?.result === 'project:author';

  if (paperQuery.isLoading || (!isNullGuid && combineQuery.isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!paper || !combine) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  return (
    <>
      <Head title="Paper Editor" />
      <CombineEditor
        paperId={paperId!}
        combineId={combineId!}
        projectId={projectId!}
        subProjectId={subProjectId}
        combine={combine}
        paperTitle={paper.title || 'Paper'}
        isAuthor={isAuthor}
        initialEditMode={isEditMode}
        onClose={() =>
          navigate({ pathname: backHref, search: '?tab=compile-paper' })
        }
      />
    </>
  );
};

export default ProjectPaperCombineEditorRoute;
