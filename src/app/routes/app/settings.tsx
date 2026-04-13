import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { BTN } from '@/lib/button-styles';

const SettingsRoute = () => {
  return (
    <>
      <Head description="Settings - Scilab" />
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure application preferences and account settings.
          </p>
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
              <Button variant="outline" className={BTN.EDIT_OUTLINE}>
                Edit Profile
              </Button>
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
              <Button variant="outline" className={BTN.VIEW_OUTLINE}>
                Configure
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsRoute;
