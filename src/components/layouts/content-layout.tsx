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
          <h1 className="text-primary font-serif text-4xl font-extrabold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        <div>{children}</div>
      </div>
    </>
  );
};
