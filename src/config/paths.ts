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
    settings: {
      path: 'settings',
      getHref: () => '/app/settings',
    },
    userManagement: {
      users: {
        path: 'users',
        getHref: () => '/app/users',
      },
      user: {
        path: 'users/:userId',
        getHref: (userId: string) => `/app/users/${userId}`,
      },
    },
    groupRoleManagement: {
      groups: {
        path: 'groups',
        getHref: () => '/app/groups',
      },
      group: {
        path: 'groups/:groupId',
        getHref: (groupId: string) => `/app/groups/${groupId}`,
      },
    },
  },
} as const;
