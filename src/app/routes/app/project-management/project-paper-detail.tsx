import { useParams } from 'react-router';
import { ProjectPaperDetailPage } from '@/features/project-management/components/papers/project-paper-detail-page';
import { paths } from '@/config/paths';

const ProjectPaperDetailRoute = () => {
  const { projectId, paperId } = useParams();

  return (
    <ProjectPaperDetailPage
      projectId={projectId!}
      paperId={paperId!}
      isManager={true}
      backPath={paths.app.projectDetail.getHref(projectId!)}
      workspacePath={paths.app.projectPaperWorkspace.getHref(
        projectId!,
        paperId!,
      )}
    />
  );
};

export default ProjectPaperDetailRoute;
