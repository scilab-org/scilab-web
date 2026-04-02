import { useParams } from 'react-router';

import { PaperWorkspacePage } from '@/features/project-management/components/papers/paper-workspace-page';
import { paths } from '@/config/paths';

const ProjectPaperWorkspaceRoute = () => {
  const { projectId, paperId } = useParams();

  return (
    <PaperWorkspacePage
      projectId={projectId!}
      paperId={paperId!}
      isManager={true}
      backPath={paths.app.projectPaperDetail.getHref(projectId!, paperId!)}
    />
  );
};

export default ProjectPaperWorkspaceRoute;
