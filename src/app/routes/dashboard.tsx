import { LogOut, User as UserIcon } from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Authorization, GROUPS } from '@/lib/authorization';
import { getUserRoles, useLogout, useUser } from '@/lib/auth';

const DashboardRoute = () => {
  const logout = useLogout();
  const { data: user } = useUser();
  const roles = getUserRoles();

  if (!user) {
    return null;
  }

  return (
    <>
      <Head description="Dashboard - Scilab" />
      <div className="bg-background min-h-screen">
        {/* Header */}
        <header className="border-border bg-card border-b">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <UserIcon className="text-primary size-8" />
              <h1 className="text-foreground text-2xl font-bold">
                Scilab Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button onClick={logout.mutate} variant="outline">
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* User Information Card */}
          <div className="bg-card border-border mb-8 rounded-lg border p-6 shadow-sm">
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              User Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Name</p>
                <p className="text-foreground font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">User ID</p>
                <p className="text-foreground font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Groups</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {user.groups.map((group) => (
                    <span
                      key={group}
                      className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">All Roles</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User Content Section */}
          <div className="bg-card border-border mb-8 rounded-lg border p-6 shadow-sm">
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              User Dashboard
            </h2>
            <p className="text-muted-foreground">
              Welcome to your dashboard! This content is visible to all
              authenticated users.
            </p>
          </div>

          {/* Project Author Only Section */}
          <Authorization
            allowedGroups={[GROUPS.PROJECT_AUTHOR]}
            forbiddenFallback={undefined}
          >
            <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                Project Author Panel
              </h2>
              <p className="text-muted-foreground mb-4">
                This section is only visible to project authors.
              </p>
              <div className="bg-primary/5 border-primary/20 rounded border p-4">
                <p className="text-foreground text-sm font-medium">
                  🎉 Congratulations! You have project author access.
                </p>
              </div>
            </div>
          </Authorization>
        </main>
      </div>
    </>
  );
};

export default DashboardRoute;
