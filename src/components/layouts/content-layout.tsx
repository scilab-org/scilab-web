import * as React from 'react';

import { Head } from '@/components/seo';

type ContentLayoutProps = {
  children: React.ReactNode;
  title: string;
  description?: string;
};

export const ContentLayout = ({
  children,
  title,
  description,
}: ContentLayoutProps) => {
  return (
    <>
      <Head title={title} description={description} />
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        <div>{children}</div>
      </div>
    </>
  );
};
