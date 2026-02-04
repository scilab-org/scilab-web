import { Monitor, Moon, Sun } from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { cn } from '@/utils/cn';

type ThemeOption = {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Use light theme',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Use dark theme',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow system preference',
  },
];

const SettingsRoute = () => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Head description="Settings - EduManager" />
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure application preferences and account settings.
          </p>
        </div>

        {/* Appearance Section */}
        <div className="border-border bg-card rounded-xl border">
          <div className="border-border border-b px-6 py-4">
            <h2 className="text-foreground text-lg font-semibold">
              Appearance
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Customize how the application looks on your device.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-foreground text-sm font-medium">Theme</h3>
                <p className="text-muted-foreground text-sm">
                  Select your preferred theme for the dashboard.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        'flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-accent',
                      )}
                    >
                      <div
                        className={cn(
                          'flex size-12 items-center justify-center rounded-lg',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isActive ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="border-border bg-card rounded-xl border">
          <div className="border-border border-b px-6 py-4">
            <h2 className="text-foreground text-lg font-semibold">Account</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your account settings and preferences.
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-foreground text-sm font-medium">
                  Profile Settings
                </h3>
                <p className="text-muted-foreground text-sm">
                  Update your profile information and preferences.
                </p>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="border-border bg-card rounded-xl border">
          <div className="border-border border-b px-6 py-4">
            <h2 className="text-foreground text-lg font-semibold">
              Notifications
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure how you receive notifications.
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-foreground text-sm font-medium">
                  Email Notifications
                </h3>
                <p className="text-muted-foreground text-sm">
                  Receive email updates about your account activity.
                </p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsRoute;
