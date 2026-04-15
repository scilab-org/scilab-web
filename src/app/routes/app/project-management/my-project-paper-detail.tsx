import { useParams } from 'react-router';

import { Head } from '@/components/seo';
import { ProjectPaperDetailPage } from '@/features/project-management/components/papers/project-paper-detail-page';
import { paths } from '@/config/paths';
import { useMyProjectRole } from '@/features/project-management/api/projects/get-my-role';

const MyProjectPaperDetailRoute = () => {
  const { projectId, paperId } = useParams();

  const roleQuery = useMyProjectRole({
    projectId: projectId!,
    queryConfig: { enabled: !!projectId },
  });
  const isManager =
    roleQuery.data?.result === 'project:project-manager' ||
    roleQuery.data?.result === 'project:admin' ||
    roleQuery.data?.result === 'system:admin';
  const isAuthor = roleQuery.data?.result === 'project:author';

  return (
    <>
      <Head title="Paper Details" />
      <ProjectPaperDetailPage
        projectId={projectId!}
        paperId={paperId!}
        isManager={isManager}
        isAuthor={isAuthor}
        backPath={paths.app.assignedProjects.detail.getHref(projectId!)}
        combineEditorPath={(combineId: string) =>
          paths.app.assignedProjects.paperCombineEditor.getHref(
            projectId!,
            paperId!,
            combineId,
          )
        }
      />
    </>
  );
};

export default MyProjectPaperDetailRoute;
