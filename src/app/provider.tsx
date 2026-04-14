import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

import { MainErrorFallback } from '@/components/errors/main';
import { AuthProvider } from '@/features/auth/auth-context';
import { queryConfig } from '@/lib/react-query';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  const shouldShowQueryDevtools =
    import.meta.env.DEV &&
    import.meta.env.VITE_SHOW_REACT_QUERY_DEVTOOLS === 'true';

  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader2 className="text-muted-foreground size-24 animate-spin" />
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster position="top-right" richColors />
            {shouldShowQueryDevtools && <ReactQueryDevtools />}
            {children}
          </QueryClientProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
