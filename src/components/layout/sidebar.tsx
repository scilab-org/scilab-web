import {
  Home,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: paths.dashboard.path,
    icon: Home,
  },
  {
    name: 'Projects',
    href: paths.projects.path,
    icon: FolderOpen,
  },
  {
    name: 'Settings',
    href: paths.settings.path,
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground flex h-full flex-col border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Sidebar Header */}
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <h2 className="text-sidebar-foreground text-xl font-bold">Scilab</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-sidebar-accent ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground',
                  collapsed && 'justify-center',
                )
              }
            >
              <Icon className="size-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-sidebar-border border-t p-4">
        <div
          className={cn(
            'text-sidebar-foreground text-xs',
            collapsed ? 'text-center' : '',
          )}
        >
          {!collapsed && <p>v1.0.0</p>}
        </div>
      </div>
    </aside>
  );
};
