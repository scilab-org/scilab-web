import { useNavigate } from 'react-router';
import { Home } from 'lucide-react';
import * as React from 'react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { paths } from '@/config/paths';
import { useLogin, useUser } from '@/lib/auth';

const LandingRoute = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { mutate: login } = useLogin();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate(paths.app.dashboard.getHref());
    }
  }, [user, navigate]);

  const handleStart = () => {
    // Trigger Keycloak login which will redirect to dashboard
    login();
  };

  return (
    <>
      <Head description="Welcome to Scilab" />
      <div className="bg-background flex h-screen items-center">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="block">Scilab</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Welcome to Scilab - Your Scientific Computing Platform
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Button onClick={handleStart}>
                <Home className="size-4" />
                Get started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingRoute;
