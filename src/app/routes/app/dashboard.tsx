import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import {
  useDashboard,
  AdminDashboard,
  AdminDashboardSkeleton,
  AdminDashboardError,
  UserDashboard,
  UserDashboardSkeleton,
} from '@/features/dashboard';
import { getUserGroups } from '@/lib/auth';

const DashboardRoute = () => {
  const { data, isLoading, isError } = useDashboard();
  const isAdmin = getUserGroups().includes('system:admin');

  const content = () => {
    if (isLoading)
      return isAdmin ? <AdminDashboardSkeleton /> : <UserDashboardSkeleton />;
    if (isError || !data) return <AdminDashboardError />;
    if (data.role === 'admin') return <AdminDashboard data={data} />;
    return <UserDashboard data={data} />;
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
