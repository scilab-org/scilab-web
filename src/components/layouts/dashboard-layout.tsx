import {
  Bell,
  Bookmark,
  BookOpen,
  ClipboardList,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutTemplate,
  LogOut,
  Search,
  Tag,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigation } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';
import { capitalize } from '@/utils/string-utils';

type SideNavigationItem = {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const Logo = () => {
  return (
    <div className="flex items-center justify-center overflow-hidden">
      <h1 className="text-foreground text-center text-lg font-bold tracking-[0.3em] uppercase transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
        HyperDataLab
      </h1>
    </div>
  );
};

const Progress = () => {
  const { state, location } = useNavigation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [location?.pathname]);

  useEffect(() => {
    if (state === 'loading') {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(timer);
            return 100;
          }
          const newProgress = oldProgress + 10;
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 300);

      return () => {
        clearInterval(timer);
      };
    }
  }, [state]);

  if (state !== 'loading') {
    return null;
  }

  return (
    <div
      className="bg-primary fixed top-0 left-0 z-50 h-1 transition-all duration-200 ease-in-out"
      style={{ width: `${progress}%` }}
    />
  );
};

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const isIdLikeSegment = (segment: string | undefined) => {
    if (!segment) return false;
    return (
      segment.length > 30 ||
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        segment,
      )
    );
  };

  const breadcrumbItems = pathSegments
    .map((segment, index, arr) => {
      const next = arr[index + 1];

      if (segment === 'papers' && isIdLikeSegment(next)) {
        return {
          label: 'Paper Detail',
          path: '/' + arr.slice(0, index + 2).join('/'),
        };
      }

      // Handle UUID-like segments
      if (isIdLikeSegment(segment)) {
        const prev = arr[index - 1];
        if (prev === 'my-projects' || prev === 'assigned-projects') {
          return {
            label: 'Project Detail',
            path: '/' + arr.slice(0, index + 1).join('/'),
          };
        }
        // Don't show "Paper Detail" for paper ID segment, stop at "Papers"
        if (prev === 'papers') {
          return null;
        }
        return null;
      }

      // Rename "my-projects" to "My projects"
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === 'my-projects') label = 'My Projects';

      return { label, path: '/' + arr.slice(0, index + 1).join('/') };
    })
    .filter(Boolean);

  // If we are in "app/my-projects/...", we want to skip "app" in breadcrumbs if displayed
  // But generally, let's keep it simple or customize further if needed.
  // The user asked for "Home > App > My-projects > Papers".
  // Currently: Home (link to assigned projects) > App > My-projects > ...
  // Let's just render what we have but style it.

  return (
    <nav className="flex items-center gap-1 text-sm">
      <NavLink
        to={paths.app.assignedProjects.list.getHref()}
        className="text-muted-foreground hover:text-foreground hidden md:block"
      >
        Home
      </NavLink>
      {breadcrumbItems.map((item, index) => (
        <span key={item!.path} className="flex items-center gap-1">
          <ChevronRight className="text-muted-foreground size-4" />
          <NavLink
            to={item!.path}
            className={cn(
              index === breadcrumbItems.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item!.label}
          </NavLink>
        </span>
      ))}
    </nav>
  );
};

const UserProfile = ({ onLogout }: { onLogout: () => void }) => {
  const { data: user } = useUser();
  const isAdmin = user?.groups?.includes('system:admin') ?? false;
  const roleLabel = isAdmin
    ? 'Administrator'
    : (user?.groups?.[0]?.split(':').pop() ?? 'Member');

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <NavLink
        to={paths.app.profile.getHref()}
        className="hover:bg-sidebar-accent flex items-center gap-3 rounded-md p-1 transition-colors"
      >
        <div className="bg-sidebar-accent flex size-8 shrink-0 items-center justify-center rounded-full">
          <span className="text-sidebar-accent-foreground text-xs font-medium">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </span>
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
          <span className="truncate font-semibold">
            {capitalize(user?.firstName ?? '')}{' '}
            {capitalize(user?.lastName ?? '')}
          </span>
          <span className="text-sidebar-foreground/70 truncate text-xs">
            {roleLabel}
          </span>
        </div>
      </NavLink>
      <button
        onClick={onLogout}
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md p-2 text-sm"
        title="Log Out"
      >
        <LogOut className="size-4 shrink-0" />
        <span className="truncate transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
          Log Out
        </span>
      </button>
    </div>
  );
};

const navigation: SideNavigationItem[] = [
  {
    name: 'Users',
    to: paths.app.userManagement.users.getHref(),
    icon: Users,
  },
  {
    name: 'Projects',
    to: paths.app.projects.getHref(),
    icon: FolderKanban,
  },
  {
    name: 'Assigned Projects',
    to: paths.app.assignedProjects.list.getHref(),
    icon: Bookmark,
  },
  {
    name: 'My Task',
    to: paths.app.myTasks.getHref(),
    icon: ClipboardList,
  },
  {
    name: 'Papers',
    to: paths.app.paperManagement.papers.getHref(),
    icon: FileText,
  },
  {
    name: 'Tags',
    to: paths.app.tagManagement.tags.getHref(),
    icon: Tag,
  },
  {
    name: 'Journals',
    to: paths.app.journalManagement.journals.getHref(),
    icon: BookOpen,
  },
  {
    name: 'Paper Templates',
    to: paths.app.paperTemplateManagement.paperTemplates.getHref(),
    icon: LayoutTemplate,
  },
  // { name: 'Settings', to: paths.app.settings.getHref(), icon: Settings },
];

const adminNavigation = navigation.filter(
  (item) => item.name !== 'Assigned Projects' && item.name !== 'My Task',
);

const memberNavigation = navigation.filter((item) =>
  ['Assigned Projects', 'My Task', 'Settings'].includes(item.name),
);

function AppSidebar() {
  const logout = useLogout();
  const location = useLocation();
  const { data: user } = useUser();

  const isAdmin = user?.groups?.includes('system:admin') ?? false;
  const navItems = isAdmin ? adminNavigation : memberNavigation;

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Logo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <NavLink to={item.to}>
                        <item.icon />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserProfile onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Read sidebar state from cookie to determine default
  const [defaultOpen] = useState(() => {
    if (typeof document === 'undefined') return true;
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sidebar_state='))
      ?.split('=')[1];
    return cookieValue !== 'false';
  });

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Progress />
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        {/* Header */}
        <header className="border-border bg-background sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 sm:px-6">
          {/* Sidebar trigger and breadcrumb */}
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            {/* Breadcrumb */}
            <div className="hidden sm:block">
              <Breadcrumb />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-ring h-9 w-64 rounded-lg border pr-4 pl-10 text-sm outline-none focus:ring-2"
              />
            </div>

            {/* Notifications */}
            <button className="text-muted-foreground hover:bg-accent hover:text-accent-foreground relative rounded-lg p-2">
              <Bell className="size-5" />
              <span className="bg-primary absolute top-1.5 right-1.5 size-2 rounded-full" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
