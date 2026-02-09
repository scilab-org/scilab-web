export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    dashboard: {
      path: '',
      getHref: () => '/app',
    },
    sample: {
      path: 'sample',
      getHref: () => '/app/sample',
    },
    projects: {
      path: 'projects',
      getHref: () => '/app/projects',
    },
    projectDetail: {
      path: 'projects/details/:projectId',
      getHref: (projectId: string) => `/app/projects/details/${projectId}`,
    },
    settings: {
      path: 'settings',
      getHref: () => '/app/settings',
    },
  },
} as const;
