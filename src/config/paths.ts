export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },
  dashboard: {
    path: '/dashboard',
    getHref: () => '/dashboard',
  },
  projects: {
    path: '/projects',
    getHref: () => '/projects',
  },
  settings: {
    path: '/settings',
    getHref: () => '/settings',
  },
} as const;
