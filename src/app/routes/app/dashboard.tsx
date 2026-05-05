import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import {
  useDashboard,
  AdminDashboard,
  AdminDashboardSkeleton,
  AdminDashboardError,
} from '@/features/dashboard';

const DashboardRoute = () => {
  const { data, isLoading, isError } = useDashboard();

  const content = () => {
    if (isLoading) return <AdminDashboardSkeleton />;
    if (isError || !data) return <AdminDashboardError />;
    if (data.role === 'admin') return <AdminDashboard data={data} />;
    return null;
  };

  return (
    <>
      <Head title="Dashboard" />
      <ContentLayout
        title="Dashboard"
        description="System overview and recent activity."
      >
        {content()}
      </ContentLayout>
    </>
  );
};

export default DashboardRoute;
