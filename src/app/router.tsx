import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { Navigate } from 'react-router';

import { ProtectedRoute } from '@/lib/auth';
import { paths } from '@/config/paths';

import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/app/root';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      element: (
        <Navigate to={paths.app.assignedProjects.list.getHref()} replace />
      ),
    },
    {
      path: paths.app.root.path,
      element: (
        <ProtectedRoute>
          <AppRoot />
        </ProtectedRoute>
      ),
      ErrorBoundary: AppRootErrorBoundary,
      children: [
        {
          path: paths.app.dashboard.path,
          element: (
            <Navigate to={paths.app.assignedProjects.list.getHref()} replace />
          ),
        },
        {
          path: paths.app.sample.path,
          lazy: () => import('./routes/app/sample').then(convert(queryClient)),
        },
        {
          path: paths.app.projects.path,
          lazy: () =>
            import('./routes/app/project-management/projects').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.projectDetail.path,
          lazy: () =>
            import('./routes/app/project-management/project-detail').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.assignedProjects.list.path,
          lazy: () =>
            import('./routes/app/project-management/my-projects').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.assignedProjects.detail.path,
          lazy: () =>
            import('./routes/app/project-management/my-project-detail').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.settings.path,
          lazy: () =>
            import('./routes/app/settings').then(convert(queryClient)),
        },
        {
          path: paths.app.userManagement.users.path,
          lazy: () =>
            import('./routes/app/user-management/users').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.userManagement.user.path,
          lazy: () =>
            import('./routes/app/user-management/user').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.groupRoleManagement.groups.path,
          lazy: () =>
            import('./routes/app/group-role-management/groups').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.groupRoleManagement.group.path,
          lazy: () =>
            import('./routes/app/group-role-management/group').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.paperManagement.papers.path,
          lazy: () =>
            import('./routes/app/paper-management/papers').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.paperManagement.paper.path,
          lazy: () =>
            import('./routes/app/paper-management/paper').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.tagManagement.tags.path,
          lazy: () =>
            import('./routes/app/tag-management/tags').then(
              convert(queryClient),
            ),
        },
        {
          path: paths.app.paperTemplateManagement.paperTemplates.path,
          lazy: () =>
            import('./routes/app/paper-template-management/paper-templates').then(
              convert(queryClient),
            ),
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
