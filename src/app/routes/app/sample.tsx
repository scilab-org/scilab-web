import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { useUser } from '@/lib/auth';

type EntryProps = {
  label: string;
  value?: string;
};

const Entry = ({ label, value }: EntryProps) => (
  <div className="border-border border-b px-4 py-4 last:border-b-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
    <dt className="text-foreground text-sm font-medium">{label}</dt>
    <dd className="text-foreground mt-1 text-sm sm:col-span-2 sm:mt-0">
      {value || '-'}
    </dd>
  </div>
);

const SampleRoute = () => {
  const { data: user } = useUser();

  if (!user) return null;

  return (
    <>
      <Head title="Sample" />
      <ContentLayout
        title="Sample Page"
        description="This is a sample page using the content layout"
      >
        <div className="bg-card border-border overflow-hidden rounded-lg border shadow">
          <div className="border-border border-b px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground text-lg leading-6 font-medium">
                  User Information
                </h3>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                  Personal details of the current user.
                </p>
              </div>
            </div>
          </div>
          <div className="divide-border divide-y">
            <Entry label="First Name" value={user.firstName || undefined} />
            <Entry label="Last Name" value={user.lastName || undefined} />
            <Entry label="Email" value={user.email || undefined} />
            <Entry label="Roles" value={user.roles?.join(', ') || undefined} />
          </div>
        </div>
      </ContentLayout>
    </>
  );
};

export default SampleRoute;
