import { useParams } from 'react-router';

import { PaperWorkspacePage } from '@/features/project-management/components/papers/paper-workspace-page';
import { paths } from '@/config/paths';
import { useMyProjectRole } from '@/features/project-management/api/projects/get-my-role';

const MyProjectPaperWorkspaceRoute = () => {
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
    <PaperWorkspacePage
      projectId={projectId!}
      paperId={paperId!}
      isManager={isManager}
      isAuthor={isAuthor}
      backPath={paths.app.assignedProjects.paperDetail.getHref(
        projectId!,
        paperId!,
      )}
    />
  );
};

export default MyProjectPaperWorkspaceRoute;
