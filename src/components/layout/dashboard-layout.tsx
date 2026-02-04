import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useLogout } from '@/lib/auth';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const logout = useLogout();

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-border bg-card flex h-16 items-center justify-end gap-4 border-b px-6">
          <ThemeToggle />
          <Button onClick={logout.mutate} variant="outline" size="sm">
            <LogOut className="size-4" />
            Logout
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
