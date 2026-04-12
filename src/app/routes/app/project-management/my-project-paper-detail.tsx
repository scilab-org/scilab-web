import { useParams } from 'react-router';
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
    <ProjectPaperDetailPage
      projectId={projectId!}
      paperId={paperId!}
      isManager={isManager}
      isAuthor={isAuthor}
      backPath={paths.app.assignedProjects.detail.getHref(projectId!)}
      workspacePath={paths.app.assignedProjects.paperWorkspace.getHref(
        projectId!,
        paperId!,
      )}
      combineEditorPath={(combineId: string) =>
        paths.app.assignedProjects.paperCombineEditor.getHref(
          projectId!,
          paperId!,
          combineId,
        )
      }
    />
  );
};

export default MyProjectPaperDetailRoute;
