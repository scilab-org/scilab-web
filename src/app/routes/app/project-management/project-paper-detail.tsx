import { useParams } from 'react-router';

import { Head } from '@/components/seo';
import { ProjectPaperDetailPage } from '@/features/project-management/components/papers/project-paper-detail-page';
import { paths } from '@/config/paths';

const ProjectPaperDetailRoute = () => {
  const { projectId, paperId } = useParams();

  return (
    <>
      <Head title="Paper Details" />
      <ProjectPaperDetailPage
        projectId={projectId!}
        paperId={paperId!}
        isManager={true}
        backPath={paths.app.projectDetail.getHref(projectId!)}
        combineEditorPath={(combineId: string) =>
          paths.app.projectPaperCombineEditor.getHref(
            projectId!,
            paperId!,
            combineId,
          )
        }
      />
    </>
  );
};

export default ProjectPaperDetailRoute;
