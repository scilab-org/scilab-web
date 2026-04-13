import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { ProfileView } from '@/features/profile/components/profile-view';

const ProfileRoute = () => {
  return (
    <>
      <Head title="My Profile" />
      <ContentLayout title="My Profile" description="">
        <ProfileView />
      </ContentLayout>
    </>
  );
};

export default ProfileRoute;
