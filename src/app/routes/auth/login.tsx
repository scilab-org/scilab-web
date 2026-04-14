import { Head } from '@/components/seo';
import { LoginPage } from '@/features/auth/components/login-page';

const LoginRoute = () => {
  return (
    <>
      <Head title="Sign In" />
      <LoginPage />
    </>
  );
};

export default LoginRoute;
